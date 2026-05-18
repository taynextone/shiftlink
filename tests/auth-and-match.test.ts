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
process.env.WHATSAPP_PROVIDER = 'mock';
process.env.NURSE_LOGIN_URL = 'https://app.shiftlink.example/login';

import request from 'supertest';
import argon2 from 'argon2';
import { InvoiceStatus, JobShiftStatus, MatchContractStatus, Prisma, UserRole, VerificationStatus } from '@prisma/client';
import { signAuthToken } from '../src/utils/jwt';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    nurseProfile: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    nurseAvailabilityBlock: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    hospitalProfile: { findUnique: jest.fn() },
    jobShift: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    matchContract: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    invoice: { create: jest.fn() },
  },
}));

jest.mock('../src/config/queues', () => ({
  billingQueue: { add: jest.fn() },
  whatsappQueue: { add: jest.fn() },
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
const matchService = require('../src/services/match.service');

describe('registration and durable match offer flow', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockReset();
    (prisma.user.create as jest.Mock).mockReset();
    (prisma.nurseProfile.findUnique as jest.Mock).mockReset();
    (prisma.nurseProfile.findMany as jest.Mock).mockReset();
    (prisma.nurseProfile.update as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.create as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.createMany as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.findMany as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.findUnique as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.update as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.delete as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.deleteMany as jest.Mock).mockReset();
    (prisma.hospitalProfile.findUnique as jest.Mock).mockReset();
    (prisma.jobShift.create as jest.Mock).mockReset();
    (prisma.jobShift.findUnique as jest.Mock).mockReset();
    (prisma.jobShift.findMany as jest.Mock).mockReset();
    (prisma.matchContract.findUnique as jest.Mock).mockReset();
    (prisma.matchContract.findMany as jest.Mock).mockReset();
    (prisma.matchContract.create as jest.Mock).mockReset();
    (prisma.matchContract.update as jest.Mock).mockReset();
    (prisma.matchContract.delete as jest.Mock).mockReset();
    (prisma.invoice.create as jest.Mock).mockReset();
    (billingQueue.add as jest.Mock).mockReset();
    (whatsappQueue.add as jest.Mock).mockReset();
  });

  it('registers a nurse and returns an auth cookie with anonymous public identity', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user_1',
      email: 'nurse@example.com',
      role: UserRole.NURSE,
      verificationStatus: VerificationStatus.PENDING,
      nurseProfile: {
        id: 'nurse_1',
        publicId: 'NUR-AB12CD34',
        displayName: 'NurseNova',
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
          displayName: 'NurseNova',
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
    expect(response.body.user.nurseProfile.publicId).toBe('NUR-AB12CD34');
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
      hospitalProfile: { id: 'hospital_1', clinicName: 'Clinic One' },
    });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'very-secure-password' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('matches available nurses to a job shift', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.jobShift.findUnique as jest.Mock).mockResolvedValue({
      id: 'shift_1',
      startTime: new Date('2026-06-16T06:00:00.000Z'),
      endTime: new Date('2026-06-20T18:00:00.000Z'),
      locationCity: 'Berlin',
      locationLatitude: new Prisma.Decimal(52.52),
      locationLongitude: new Prisma.Decimal(13.405),
      hospitalProfile: { userId: 'hospital_owner_1' },
      requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }, { tag: 'fachweiterbildung-intensiv', priority: 'PREFERRED' }],
      matchContracts: [],
    });
    (prisma.nurseProfile.findMany as jest.Mock).mockResolvedValue([{ id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', minHourlyRate: new Prisma.Decimal(49), preferredShiftType: 'FLEXIBLE', specializations: [{ tag: 'intensivstation' }, { tag: 'fachweiterbildung-intensiv' }], availabilityBlocks: [{ id: 'block_1', city: 'Berlin', latitude: new Prisma.Decimal(52.520008), longitude: new Prisma.Decimal(13.404954), radiusKm: 25, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z'), isBooked: false }], matchContracts: [] }]);
    const response = await request(app).post('/api/v1/matches/candidates').set('Cookie', [`shiftlink_token=${token}`]).send({ jobShiftId: 'shift_1' });
    expect(response.status).toBe(200);
    expect(response.body.candidates).toHaveLength(1);
  });

  it('creates a match offer and queues WhatsApp notification', async () => {
    (prisma.jobShift.findUnique as jest.Mock).mockResolvedValue({
      id: 'shift_1',
      status: JobShiftStatus.OPEN,
      startTime: new Date('2026-06-16T06:00:00.000Z'),
      endTime: new Date('2026-06-20T18:00:00.000Z'),
      locationCity: 'Berlin',
      hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1', clinicName: 'Clinic One' },
      requirements: [],
      matchContracts: [],
    });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      publicId: 'NUR-AB12CD34',
      displayName: 'NurseNova',
      phoneNumber: '+491701234567',
      whatsappOptIn: true,
      availabilityBlocks: [{ id: 'block_1', isBooked: false, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z') }],
      specializations: [],
    });
    (prisma.matchContract.create as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      invoice: null,
      nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true },
      jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { clinicName: 'Clinic One' }, requirements: [] },
    });

    const result = await matchService.createMatchOffer(
      { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN },
      { jobShiftId: 'shift_1', nurseProfileId: 'nurse_1' },
    );

    expect(result.status).toBe(MatchContractStatus.PENDING);
    expect(whatsappQueue.add).toHaveBeenCalledWith(
      'new-match-offer-notification',
      expect.objectContaining({ matchContractId: 'contract_1', phoneNumber: '+491701234567', type: 'new-match-offer' }),
      { jobId: 'new-match-offer:contract_1' },
    );
  });

  it('lists hospital offers for a job shift with statuses', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.jobShift.findUnique as jest.Mock).mockResolvedValue({
      id: 'shift_1',
      title: 'ITS Einsatz',
      status: JobShiftStatus.OPEN,
      startTime: new Date('2026-06-16T06:00:00.000Z'),
      endTime: new Date('2026-06-20T18:00:00.000Z'),
      locationCity: 'Berlin',
      hospitalProfile: { userId: 'hospital_owner_1' },
      matchContracts: [
        {
          id: 'contract_1',
          status: MatchContractStatus.PENDING,
          signedAt: null,
          createdAt: new Date('2026-05-18T00:00:00.000Z'),
          updatedAt: new Date('2026-05-18T00:00:00.000Z'),
          invoice: null,
          nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', minHourlyRate: new Prisma.Decimal(49) },
        },
        {
          id: 'contract_2',
          status: MatchContractStatus.DECLINED,
          signedAt: null,
          createdAt: new Date('2026-05-18T01:00:00.000Z'),
          updatedAt: new Date('2026-05-18T02:00:00.000Z'),
          invoice: null,
          nurseProfile: { id: 'nurse_2', publicId: 'NUR-XY98ZT77', displayName: 'NurseLuna', minHourlyRate: new Prisma.Decimal(52) },
        },
      ],
    });

    const response = await request(app)
      .get('/api/v1/matches/hospital-offers?jobShiftId=shift_1')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.offers).toHaveLength(2);
    expect(response.body.offers[1].status).toBe(MatchContractStatus.DECLINED);
  });

  it('allows nurse to accept an offer and signs it without sending another WhatsApp', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'nurse_1', userId: 'nurse_user_1' })
      .mockResolvedValueOnce({
        id: 'contract_1',
        jobShift: { startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z') },
        nurseProfile: { availabilityBlocks: [{ id: 'block_1', nurseProfileId: 'nurse_1', city: 'Berlin', radiusKm: 25, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z'), isBooked: false }] },
      });
    (prisma.matchContract.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'contract_1', nurseProfileId: 'nurse_1', status: MatchContractStatus.PENDING, invoice: null, nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true }, jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { userId: 'hospital_owner_1', clinicName: 'Clinic One' }, requirements: [] } })
      .mockResolvedValueOnce({ id: 'contract_1', status: MatchContractStatus.PENDING, invoice: null, nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true }, jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { userId: 'hospital_owner_1', clinicName: 'Clinic One' } } })
      .mockResolvedValueOnce({ id: 'contract_1', jobShift: { startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z') }, nurseProfile: { availabilityBlocks: [{ id: 'block_1', nurseProfileId: 'nurse_1', city: 'Berlin', radiusKm: 25, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z'), isBooked: false }] } });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', status: MatchContractStatus.SIGNED, signedAt: new Date('2026-05-15T00:00:00.000Z'), invoice: null, nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true }, jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), status: JobShiftStatus.MATCHED, hospitalProfile: { userId: 'hospital_owner_1', clinicName: 'Clinic One' } } });
    (prisma.nurseAvailabilityBlock.update as jest.Mock).mockResolvedValue({ id: 'block_1', isBooked: true });
    (prisma.nurseAvailabilityBlock.create as jest.Mock).mockResolvedValue({});

    const response = await request(app)
      .post('/api/v1/matches/respond')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ matchContractId: 'contract_1', action: 'ACCEPT' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ACCEPTED');
    expect(billingQueue.add).toHaveBeenCalled();
    expect(whatsappQueue.add).not.toHaveBeenCalled();
  });

  it('marks declined offers durably instead of deleting them', async () => {
    (prisma.nurseProfile.findUnique as jest.Mock).mockImplementationOnce(async () => ({ id: 'nurse_1', userId: 'nurse_user_1' }));
    (prisma.matchContract.findUnique as jest.Mock).mockImplementationOnce(async () => ({ id: 'contract_1', nurseProfileId: 'nurse_1', status: MatchContractStatus.PENDING, invoice: null, nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true }, jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { userId: 'hospital_owner_1', clinicName: 'Clinic One' }, requirements: [] } }));
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', status: MatchContractStatus.DECLINED });

    const result = await matchService.respondToMatchOffer(
      { userId: 'nurse_user_1', role: UserRole.NURSE },
      { matchContractId: 'contract_1', action: 'DECLINE' },
    );

    expect(result.status).toBe('DECLINED');
    expect(prisma.matchContract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contract_1' },
        data: { status: MatchContractStatus.DECLINED },
      }),
    );
    expect(prisma.matchContract.delete).not.toHaveBeenCalled();
    expect(whatsappQueue.add).not.toHaveBeenCalled();
  });

  it('lists own match contracts for a nurse', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_1', userId: 'nurse_user_1' });
    (prisma.matchContract.findMany as jest.Mock).mockResolvedValue([{ id: 'contract_1', status: MatchContractStatus.DECLINED }]);
    const response = await request(app).get('/api/v1/matches/me').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(200);
    expect(response.body.matchContracts).toHaveLength(1);
    expect(response.body.matchContracts[0].status).toBe(MatchContractStatus.DECLINED);
  });

  it('creates an invoice amount based on total planned hours times platform fee', async () => {
    const { createInvoiceForSignedContract } = require('../src/services/billing.service');
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({ id: 'contract_2', invoice: null, jobShift: { totalPlannedHours: new Prisma.Decimal(12.5) } });
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 'invoice_1', matchContractId: 'contract_2', amount: new Prisma.Decimal(37.5), status: InvoiceStatus.PENDING });
    const invoice = await createInvoiceForSignedContract('contract_2');
    expect(invoice.amount.toString()).toBe('37.5');
  });
});
