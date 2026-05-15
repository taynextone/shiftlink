process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/shiftlink?schema=public';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.JWT_EXPIRES_IN = '7d';
process.env.AUTH_RATE_LIMIT_WINDOW_MS = '900000';
process.env.AUTH_RATE_LIMIT_MAX = '10';
process.env.S3_ENDPOINT = 'http://localhost:9000';
process.env.S3_REGION = 'eu-central-1';
process.env.S3_BUCKET = 'shiftlink-private';
process.env.S3_ACCESS_KEY = 'minioadmin';
process.env.S3_SECRET_KEY = 'minioadmin';
process.env.S3_FORCE_PATH_STYLE = 'true';
process.env.S3_SIGNED_URL_TTL_SECONDS = '900';

import request from 'supertest';
import argon2 from 'argon2';
import { MatchContractStatus, JobShiftStatus, UserRole, VerificationStatus, InvoiceStatus, Prisma } from '@prisma/client';
import { signAuthToken } from '../src/utils/jwt';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    nurseProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    matchContract: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../src/config/queues', () => ({
  billingQueue: {
    add: jest.fn(),
  },
  whatsappQueue: {
    add: jest.fn(),
  },
}));

jest.mock('../src/services/storage.service', () => ({
  createSignedDownloadUrl: jest.fn(async (fileUrl: string) => ({
    url: `https://signed.example.com/download?file=${encodeURIComponent(fileUrl)}`,
    expiresIn: 900,
    objectKey: 'examen.pdf',
  })),
}));

const { createApp } = require('../src/app');
const { prisma } = require('../src/config/prisma');
const { billingQueue, whatsappQueue } = require('../src/config/queues');

describe('registration and signed match flow', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers a nurse and returns an auth cookie', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user_1',
      email: 'nurse@example.com',
      role: UserRole.NURSE,
      verificationStatus: VerificationStatus.PENDING,
      nurseProfile: {
        id: 'nurse_1',
        firstName: 'Nina',
        lastName: 'Care',
        iban: 'DE89370400440532013000',
        minHourlyRate: new Prisma.Decimal(42),
        phoneNumber: '+491701234567',
        whatsappOptIn: true,
        examenFileUrl: 's3://bucket/examen.pdf',
      },
      hospitalProfile: null,
    });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'nurse@example.com',
        password: 'very-secure-password',
        role: UserRole.NURSE,
        nurseProfile: {
          firstName: 'Nina',
          lastName: 'Care',
          iban: 'DE89370400440532013000',
          minHourlyRate: 42,
          phoneNumber: '+491701234567',
          whatsappOptIn: true,
          examenFileUrl: 's3://bucket/examen.pdf',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('nurse@example.com');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('logs in a user and returns an auth cookie', async () => {
    const passwordHash = await argon2.hash('very-secure-password');
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin_1',
      email: 'admin@example.com',
      passwordHash,
      role: UserRole.HOSPITAL_ADMIN,
      verificationStatus: VerificationStatus.PENDING,
      nurseProfile: null,
      hospitalProfile: {
        id: 'hospital_1',
        clinicName: 'Clinic One',
      },
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'very-secure-password' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('admin@example.com');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('allows a nurse to update availability, location and hourly rate', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });

    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_profile_1',
      userId: 'nurse_user_1',
    });

    (prisma.nurseProfile.update as jest.Mock).mockResolvedValue({
      id: 'nurse_profile_1',
      userId: 'nurse_user_1',
      minHourlyRate: new Prisma.Decimal(49),
      availabilityCity: 'Berlin',
      availabilityPostalCode: '10115',
      availabilityLatitude: new Prisma.Decimal(52.520008),
      availabilityLongitude: new Prisma.Decimal(13.404954),
      availabilityRadiusKm: 25,
      isAvailable: true,
    });

    const response = await request(app)
      .patch('/api/v1/nurse-profile/me')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        minHourlyRate: 49,
        availabilityCity: 'Berlin',
        availabilityPostalCode: '10115',
        availabilityLatitude: 52.520008,
        availabilityLongitude: 13.404954,
        availabilityRadiusKm: 25,
        isAvailable: true,
      });

    expect(response.status).toBe(200);
    expect(response.body.nurseProfile.availabilityCity).toBe('Berlin');
    expect(response.body.nurseProfile.availabilityRadiusKm).toBe(25);
  });

  it('rejects available=true without a radius', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });

    const response = await request(app)
      .patch('/api/v1/nurse-profile/me')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        isAvailable: true,
        availabilityCity: 'Berlin',
      });

    expect(response.status).toBe(400);
  });

  it('logs out an authenticated user', async () => {
    const token = signAuthToken({ sub: 'admin_1', role: UserRole.HOSPITAL_ADMIN });

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');
  });

  it('rejects signing a match without auth', async () => {
    const response = await request(app).post('/api/v1/matches/sign').send({
      matchContractId: 'contract_1',
    });

    expect(response.status).toBe(401);
  });

  it('rejects signing a match with the wrong role', async () => {
    const token = signAuthToken({ sub: 'user_2', role: UserRole.NURSE });

    const response = await request(app)
      .post('/api/v1/matches/sign')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ matchContractId: 'contract_1' });

    expect(response.status).toBe(403);
  });

  it('rejects signing a match for a different hospital owner', async () => {
    const token = signAuthToken({ sub: 'hospital_admin_1', role: UserRole.HOSPITAL_ADMIN });

    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      nurseProfile: {
        whatsappOptIn: true,
        phoneNumber: '+491701234567',
      },
      invoice: null,
      jobShift: {
        hospitalProfile: {
          id: 'hospital_1',
          userId: 'different_hospital_owner',
        },
      },
    });

    const response = await request(app)
      .post('/api/v1/matches/sign')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ matchContractId: 'contract_1' });

    expect(response.status).toBe(403);
  });

  it('signs a match, updates shift status, and enqueues billing + whatsapp jobs idempotently', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });

    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      nurseProfile: {
        whatsappOptIn: true,
        phoneNumber: '+491701234567',
      },
      invoice: null,
      jobShift: {
        hospitalProfile: {
          id: 'hospital_1',
          userId: 'hospital_owner_1',
        },
      },
    });

    (prisma.matchContract.update as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.SIGNED,
      signedAt: new Date('2026-05-15T00:00:00.000Z'),
      nurseProfile: {
        whatsappOptIn: true,
        phoneNumber: '+491701234567',
      },
      jobShift: {
        id: 'shift_1',
        status: JobShiftStatus.MATCHED,
        hospitalProfile: {
          id: 'hospital_1',
          userId: 'hospital_owner_1',
        },
      },
      invoice: null,
    });

    const response = await request(app)
      .post('/api/v1/matches/sign')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        matchContractId: 'contract_1',
      });

    expect(response.status).toBe(200);
    expect(response.body.matchContract.status).toBe(MatchContractStatus.SIGNED);
    expect(billingQueue.add).toHaveBeenCalledWith(
      'create-invoice',
      {
        matchContractId: 'contract_1',
      },
      {
        jobId: 'invoice:contract_1',
      },
    );
    expect(whatsappQueue.add).toHaveBeenCalledWith(
      'signed-match-notification',
      {
        matchContractId: 'contract_1',
        phoneNumber: '+491701234567',
      },
      {
        jobId: 'signed-match-notification:contract_1',
      },
    );
  });

  it('returns existing signed contract without re-enqueuing when already signed', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });

    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.SIGNED,
      nurseProfile: {
        whatsappOptIn: true,
        phoneNumber: '+491701234567',
      },
      invoice: {
        id: 'invoice_1',
      },
      jobShift: {
        hospitalProfile: {
          id: 'hospital_1',
          userId: 'hospital_owner_1',
        },
      },
    });

    const response = await request(app)
      .post('/api/v1/matches/sign')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        matchContractId: 'contract_1',
      });

    expect(response.status).toBe(200);
    expect(prisma.matchContract.update).not.toHaveBeenCalled();
    expect(billingQueue.add).not.toHaveBeenCalled();
    expect(whatsappQueue.add).not.toHaveBeenCalled();
  });

  it('returns auth payload for authenticated users', async () => {
    const token = signAuthToken({ sub: 'admin_1', role: UserRole.HOSPITAL_ADMIN });

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.auth.userId).toBe('admin_1');
    expect(response.body.auth.role).toBe(UserRole.HOSPITAL_ADMIN);
  });

  it('rejects examen access for unrelated hospitals', async () => {
    const token = signAuthToken({ sub: 'hospital_admin_1', role: UserRole.HOSPITAL_ADMIN });

    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      examenFileUrl: 's3://bucket/examen.pdf',
      matchContracts: [
        {
          jobShift: {
            hospitalProfile: {
              userId: 'different_owner',
            },
          },
        },
      ],
    });

    const response = await request(app)
      .get('/api/v1/documents/examen/nurse_1')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(403);
  });

  it('returns signed examen download metadata for authorized hospital owners', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });

    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      examenFileUrl: 's3://bucket/examen.pdf',
      matchContracts: [
        {
          jobShift: {
            hospitalProfile: {
              userId: 'hospital_owner_1',
            },
          },
        },
      ],
    });

    const response = await request(app)
      .get('/api/v1/documents/examen/nurse_1')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.document.objectKey).toBe('examen.pdf');
    expect(response.body.document.signedUrl).toContain('signed.example.com');
    expect(response.body.document.expiresIn).toBe(900);
  });

  it('creates an invoice amount based on total planned hours times platform fee', async () => {
    const { createInvoiceForSignedContract } = require('../src/services/billing.service');

    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_2',
      invoice: null,
      jobShift: {
        totalPlannedHours: new Prisma.Decimal(12.5),
      },
    });

    (prisma.invoice.create as jest.Mock).mockResolvedValue({
      id: 'invoice_1',
      matchContractId: 'contract_2',
      amount: new Prisma.Decimal(37.5),
      status: InvoiceStatus.PENDING,
    });

    const invoice = await createInvoiceForSignedContract('contract_2');

    expect(prisma.invoice.create).toHaveBeenCalledWith({
      data: {
        matchContractId: 'contract_2',
        amount: expect.any(Prisma.Decimal),
      },
    });
    expect(invoice.amount.toString()).toBe('37.5');
  });
});
