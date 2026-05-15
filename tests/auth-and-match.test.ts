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

import request from 'supertest';
import { MatchContractStatus, JobShiftStatus, UserRole, VerificationStatus, InvoiceStatus, Prisma } from '@prisma/client';
import { signAuthToken } from '../src/utils/jwt';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
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

  it('signs a match, updates shift status, and enqueues billing + whatsapp jobs', async () => {
    const token = signAuthToken({ sub: 'admin_1', role: UserRole.HOSPITAL_ADMIN });

    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      nurseProfile: {
        whatsappOptIn: true,
        phoneNumber: '+491701234567',
      },
      jobShift: {
        hospitalProfile: {
          id: 'hospital_1',
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
    expect(billingQueue.add).toHaveBeenCalledWith('create-invoice', {
      matchContractId: 'contract_1',
    });
    expect(whatsappQueue.add).toHaveBeenCalledWith('signed-match-notification', {
      matchContractId: 'contract_1',
      phoneNumber: '+491701234567',
    });
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
