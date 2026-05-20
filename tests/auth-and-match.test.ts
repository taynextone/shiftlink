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
import { InvoiceStatus, JobShiftStatus, MatchContractStatus, Prisma, UserRole, VerificationStatus, VerificationDocumentStatus, VerificationDocumentType } from '@prisma/client';
import { signAuthToken } from '../src/utils/jwt';

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    VerificationDocumentType: {
      EXAMEN: 'EXAMEN',
      SPECIALIZATION_CERTIFICATE: 'SPECIALIZATION_CERTIFICATE',
      OCCUPATIONAL_HEALTH_CLEARANCE: 'OCCUPATIONAL_HEALTH_CLEARANCE',
    },
    VerificationDocumentStatus: {
      PENDING: 'PENDING',
      VERIFIED: 'VERIFIED',
      REJECTED: 'REJECTED',
    },
  };
});

jest.mock('../src/config/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    nurseProfile: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    verificationDocument: { findUnique: jest.fn(), update: jest.fn() },
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
    jobShift: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    matchContract: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    contractSnapshot: { create: jest.fn() },
    invoice: { create: jest.fn(), findMany: jest.fn() },
    webhookEvent: { create: jest.fn() },
  },
}));

jest.mock('../src/config/queues', () => ({
  billingQueue: { add: jest.fn() },
  whatsappQueue: { add: jest.fn() },
  webhookQueue: { add: jest.fn() },
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
const { billingQueue, whatsappQueue, webhookQueue } = require('../src/config/queues');
const matchService = require('../src/services/match.service');

describe('hospital integration and scalable match flow', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockReset();
    (prisma.user.create as jest.Mock).mockReset();
    (prisma.nurseProfile.findUnique as jest.Mock).mockReset();
    (prisma.nurseProfile.findMany as jest.Mock).mockReset();
    (prisma.nurseProfile.update as jest.Mock).mockReset();
    (prisma.verificationDocument.findUnique as jest.Mock).mockReset();
    (prisma.verificationDocument.update as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.create as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.createMany as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.findMany as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.findUnique as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.update as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.delete as jest.Mock).mockReset();
    (prisma.nurseAvailabilityBlock.deleteMany as jest.Mock).mockReset();
    (prisma.hospitalProfile.findUnique as jest.Mock).mockReset();
    (prisma.jobShift.create as jest.Mock).mockReset();
    (prisma.jobShift.update as jest.Mock).mockReset();
    (prisma.jobShift.findUnique as jest.Mock).mockReset();
    (prisma.jobShift.findMany as jest.Mock).mockReset();
    (prisma.matchContract.findUnique as jest.Mock).mockReset();
    (prisma.matchContract.findMany as jest.Mock).mockReset();
    (prisma.matchContract.create as jest.Mock).mockReset();
    (prisma.matchContract.update as jest.Mock).mockReset();
    (prisma.matchContract.delete as jest.Mock).mockReset();
    (prisma.contractSnapshot.create as jest.Mock).mockReset();
    (prisma.invoice.create as jest.Mock).mockReset();
    (prisma.invoice.findMany as jest.Mock).mockReset();
    (prisma.webhookEvent.create as jest.Mock).mockReset();
    (billingQueue.add as jest.Mock).mockReset();
    (whatsappQueue.add as jest.Mock).mockReset();
    (webhookQueue.add as jest.Mock).mockReset();
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

  it('imports a hospital job shift and updates it explicitly on repeated import while still open and unoffered', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.hospitalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'hospital_1', userId: 'hospital_owner_1' });
    (prisma.jobShift.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'shift_existing',
        externalJobShiftId: 'ext-123',
        title: 'ITS Einsatz alt',
        status: JobShiftStatus.OPEN,
        requirements: [],
        matchContracts: [],
      });
    (prisma.jobShift.create as jest.Mock).mockResolvedValue({
      id: 'shift_1',
      externalJobShiftId: 'ext-123',
      title: 'ITS Einsatz',
      status: JobShiftStatus.OPEN,
      requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }],
    });
    (prisma.jobShift.update as jest.Mock).mockResolvedValue({
      id: 'shift_existing',
      externalJobShiftId: 'ext-123',
      title: 'ITS Einsatz neu',
      status: JobShiftStatus.OPEN,
      requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }],
    });
    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'webhook_1' });

    const first = await request(app)
      .post('/api/v1/job-shifts/import')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        externalJobShiftId: 'ext-123',
        title: 'ITS Einsatz',
        locationCity: 'Berlin',
        startTime: '2026-06-16T06:00:00.000Z',
        endTime: '2026-06-20T18:00:00.000Z',
        totalPlannedHours: 12,
        requirements: [{ tag: 'Intensivstation', priority: 'REQUIRED' }],
      });

    const second = await request(app)
      .post('/api/v1/job-shifts/import')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        externalJobShiftId: 'ext-123',
        title: 'ITS Einsatz neu',
        locationCity: 'Berlin',
        startTime: '2026-06-17T06:00:00.000Z',
        endTime: '2026-06-21T18:00:00.000Z',
        totalPlannedHours: 16,
        requirements: [{ tag: 'Intensivstation', priority: 'REQUIRED' }],
      });

    expect(first.status).toBe(201);
    expect(first.body.mode).toBe('created');
    expect(second.status).toBe(200);
    expect(second.body.mode).toBe('updated');
    expect(prisma.jobShift.update).toHaveBeenCalled();
    expect(prisma.webhookEvent.create).toHaveBeenCalledTimes(2);
  });

  it('rejects import updates when pending offers already exist', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.hospitalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'hospital_1', userId: 'hospital_owner_1' });
    (prisma.jobShift.findUnique as jest.Mock).mockResolvedValue({
      id: 'shift_existing',
      externalJobShiftId: 'ext-123',
      title: 'ITS Einsatz alt',
      status: JobShiftStatus.OPEN,
      requirements: [],
      matchContracts: [{ status: MatchContractStatus.PENDING }],
    });

    const response = await request(app)
      .post('/api/v1/job-shifts/import')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        externalJobShiftId: 'ext-123',
        title: 'ITS Einsatz neu',
        locationCity: 'Berlin',
        startTime: '2026-06-17T06:00:00.000Z',
        endTime: '2026-06-21T18:00:00.000Z',
        totalPlannedHours: 16,
        requirements: [{ tag: 'Intensivstation', priority: 'REQUIRED' }],
      });

    expect(response.status).toBe(409);
    expect(prisma.jobShift.update).not.toHaveBeenCalled();
  });

  it('lists hospital job shifts with offer count summary and external ids', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.hospitalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'hospital_1', userId: 'hospital_owner_1' });
    (prisma.jobShift.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'shift_1',
        externalJobShiftId: 'ext-123',
        title: 'ITS Einsatz',
        department: 'ITS',
        stationName: 'A1',
        locationCity: 'Berlin',
        startTime: new Date('2026-06-16T06:00:00.000Z'),
        endTime: new Date('2026-06-20T18:00:00.000Z'),
        status: JobShiftStatus.OPEN,
        totalPlannedHours: new Prisma.Decimal(12),
        requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }],
        matchContracts: [
          { status: MatchContractStatus.PENDING, invoice: null },
          { status: MatchContractStatus.DECLINED, invoice: null },
          { status: MatchContractStatus.SIGNED, invoice: { id: 'invoice_1' } },
        ],
      },
    ]);

    const response = await request(app)
      .get('/api/v1/job-shifts')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.jobShifts[0].externalJobShiftId).toBe('ext-123');
    expect(response.body.jobShifts[0].offerCounts).toEqual({
      total: 3,
      pending: 1,
      declined: 1,
      signed: 1,
      expired: 0,
      canceled: 0,
      invoiced: 1,
    });
  });


  it('returns hospital billing summary for administration', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.hospitalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'hospital_1', userId: 'hospital_owner_1' });
    (prisma.matchContract.findMany as jest.Mock).mockResolvedValue([
      { status: MatchContractStatus.SIGNED, invoice: { amount: new Prisma.Decimal(36), status: InvoiceStatus.PENDING }, jobShift: { id: 'shift_1' } },
      { status: MatchContractStatus.SIGNED, invoice: { amount: new Prisma.Decimal(48), status: InvoiceStatus.PAID }, jobShift: { id: 'shift_2' } },
      { status: MatchContractStatus.DECLINED, invoice: null, jobShift: { id: 'shift_3' } },
    ]);

    const response = await request(app)
      .get('/api/v1/job-shifts/billing/summary')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.summary).toEqual({
      signedContracts: 2,
      invoiceCount: 2,
      totalInvoiceAmount: 84,
      pendingInvoiceAmount: 36,
      paidInvoiceAmount: 48,
    });
  });

  it('exports hospital billing data as csv', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.hospitalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'hospital_1', userId: 'hospital_owner_1' });
    (prisma.invoice.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'invoice_1',
        status: InvoiceStatus.PENDING,
        amount: new Prisma.Decimal(36),
        createdAt: new Date('2026-05-20T08:00:00.000Z'),
        matchContract: {
          id: 'contract_1',
          status: MatchContractStatus.SIGNED,
          signedAt: new Date('2026-05-20T07:00:00.000Z'),
          nurseProfile: { publicId: 'NUR-AB12CD34', displayName: 'NurseNova' },
          jobShift: { id: 'shift_1', externalJobShiftId: 'ext-123', title: 'ITS Einsatz', locationCity: 'Berlin' },
        },
      },
    ]);

    const response = await request(app)
      .get('/api/v1/job-shifts/billing/export?format=csv')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('invoiceId,invoiceStatus,invoiceAmount');
    expect(response.text).toContain('invoice_1');
    expect(response.text).toContain('NUR-AB12CD34');
  });

  it('creates a match offer and queues WhatsApp notification with expiry', async () => {
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
      isReleasedForMatching: true,
      availabilityBlocks: [{ id: 'block_1', isBooked: false, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z') }],
      specializations: [],
    });
    (prisma.matchContract.create as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      expiresAt: new Date('2026-05-19T00:00:00.000Z'),
      invoice: null,
      nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true },
      jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { clinicName: 'Clinic One' }, requirements: [] },
    });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      currentSnapshot: null,
      contractSnapshots: [],
      nurseProfile: {
        id: 'nurse_1',
        userId: 'nurse_user_1',
        publicId: 'NUR-AB12CD34',
        displayName: 'NurseNova',
        firstName: 'Nina',
        lastName: 'Care',
        minHourlyRate: new Prisma.Decimal(49),
        specializations: [],
      },
      jobShift: {
        id: 'shift_1',
        externalJobShiftId: 'ext-123',
        title: 'ITS Einsatz',
        department: 'ITS',
        stationName: 'A1',
        locationCity: 'Berlin',
        startTime: new Date('2026-06-16T06:00:00.000Z'),
        endTime: new Date('2026-06-20T18:00:00.000Z'),
        totalPlannedHours: new Prisma.Decimal(12),
        hospitalProfile: { id: 'hospital_1', clinicName: 'Clinic One', billingAddress: 'Street 1', taxNumber: 'TAX-1', userId: 'hospital_owner_1' },
        requirements: [],
      },
    });
    (prisma.contractSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snapshot_1', version: 1, summaryText: 'summary' });

    const result = await matchService.createMatchOffer(
      { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN },
      { jobShiftId: 'shift_1', nurseProfileId: 'nurse_1' },
    );

    expect(result.status).toBe(MatchContractStatus.PENDING);
    expect(prisma.matchContract.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: MatchContractStatus.PENDING,
          expiresAt: expect.any(Date),
        }),
      }),
    );
    expect(whatsappQueue.add).toHaveBeenCalled();
  });

  it('creates webhook foundation events on direct shift creation', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.hospitalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'hospital_1', userId: 'hospital_owner_1' });
    (prisma.jobShift.create as jest.Mock).mockResolvedValue({
      id: 'shift_1',
      externalJobShiftId: null,
      title: 'ITS Einsatz',
      status: JobShiftStatus.OPEN,
      requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }],
    });
    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'webhook_1' });

    const response = await request(app)
      .post('/api/v1/job-shifts')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        title: 'ITS Einsatz',
        locationCity: 'Berlin',
        startTime: '2026-06-16T06:00:00.000Z',
        endTime: '2026-06-20T18:00:00.000Z',
        totalPlannedHours: 12,
        requirements: [{ tag: 'Intensivstation', priority: 'REQUIRED' }],
      });

    expect(response.status).toBe(201);
    expect(prisma.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'shift.created',
          hospitalProfileId: 'hospital_1',
        }),
      }),
    );
  });

  it('expires overdue pending offers when nurse tries to respond', async () => {
    const expiredAt = new Date(Date.now() - 60_000);
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_1', userId: 'nurse_user_1' });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      nurseProfileId: 'nurse_1',
      status: MatchContractStatus.PENDING,
      expiresAt: expiredAt,
      invoice: null,
      nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true },
      jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { userId: 'hospital_owner_1', clinicName: 'Clinic One' }, requirements: [] },
    });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      nurseProfileId: 'nurse_1',
      status: MatchContractStatus.EXPIRED,
      expiresAt: expiredAt,
      respondedAt: null,
      invoice: null,
      nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true },
      jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { userId: 'hospital_owner_1', clinicName: 'Clinic One' }, requirements: [] },
    });

    await expect(
      matchService.respondToMatchOffer(
        { userId: 'nurse_user_1', role: UserRole.NURSE },
        { matchContractId: 'contract_1', action: 'ACCEPT' },
      ),
    ).rejects.toMatchObject({ status: 409 });

    expect(prisma.matchContract.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'contract_1' },
        data: { status: MatchContractStatus.EXPIRED },
      }),
    );
  });


  it('excludes unreleased nurses from hospital candidate matching', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.jobShift.findUnique as jest.Mock).mockResolvedValue({
      id: 'shift_1',
      startTime: new Date('2026-06-16T06:00:00.000Z'),
      endTime: new Date('2026-06-20T18:00:00.000Z'),
      locationCity: 'Berlin',
      locationLatitude: new Prisma.Decimal(52.52),
      locationLongitude: new Prisma.Decimal(13.405),
      hospitalProfile: { userId: 'hospital_owner_1' },
      requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }],
      matchContracts: [],
    });
    (prisma.nurseProfile.findMany as jest.Mock).mockResolvedValue([{ id: 'nurse_1', isReleasedForMatching: false, publicId: 'NUR-AB12CD34', displayName: 'NurseNova', minHourlyRate: new Prisma.Decimal(49), preferredShiftType: 'FLEXIBLE', specializations: [{ tag: 'intensivstation' }], availabilityBlocks: [{ id: 'block_1', city: 'Berlin', radiusKm: 25, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z'), isBooked: false }], matchContracts: [] }]);

    const response = await request(app).post('/api/v1/matches/candidates').set('Cookie', [`shiftlink_token=${token}`]).send({ jobShiftId: 'shift_1' });

    expect(response.status).toBe(200);
    expect(response.body.candidates).toHaveLength(0);
  });

  it('returns no visible job shifts for unreleased nurses', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      userId: 'nurse_user_1',
      isReleasedForMatching: false,
      specializations: [{ tag: 'intensivstation' }],
      availabilityBlocks: [],
      matchContracts: [],
    });

    const response = await request(app).get('/api/v1/matches/visible-job-shifts').set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.jobShifts).toHaveLength(0);
  });

  it('reviews verification documents and releases nurse for matching when required docs are verified', async () => {
    const token = signAuthToken({ sub: 'super_admin_1', role: UserRole.SUPER_ADMIN });
    (prisma.verificationDocument.findUnique as jest.Mock).mockResolvedValue({
      id: 'doc_1',
      documentType: 'EXAMEN',
      nurseProfile: {
        id: 'nurse_1',
        verificationDocuments: [
          { id: 'doc_1', documentType: 'EXAMEN', status: 'PENDING' },
          { id: 'doc_2', documentType: 'OCCUPATIONAL_HEALTH_CLEARANCE', status: 'VERIFIED' },
        ],
      },
    });
    (prisma.verificationDocument.update as jest.Mock).mockResolvedValue({
      id: 'doc_1',
      documentType: 'EXAMEN',
      status: 'VERIFIED',
      nurseProfile: {
        id: 'nurse_1',
        verificationDocuments: [
          { id: 'doc_1', documentType: 'EXAMEN', status: 'VERIFIED' },
          { id: 'doc_2', documentType: 'OCCUPATIONAL_HEALTH_CLEARANCE', status: 'VERIFIED' },
        ],
      },
    });
    (prisma.nurseProfile.update as jest.Mock).mockResolvedValue({ id: 'nurse_1', isReleasedForMatching: true });

    const response = await request(app)
      .post('/api/v1/nurse-profile/verification/review')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ documentId: 'doc_1', status: 'VERIFIED' });

    expect(response.status).toBe(200);
    expect(prisma.nurseProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'nurse_1' },
        data: expect.objectContaining({ isReleasedForMatching: true, releasedAt: expect.any(Date) }),
      }),
    );
  });

  it('shows nurse verification overview', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      userId: 'nurse_user_1',
      isReleasedForMatching: true,
      releasedAt: new Date('2026-05-20T10:00:00.000Z'),
      verificationDocuments: [{ id: 'doc_1', documentType: 'EXAMEN', status: 'VERIFIED' }],
    });

    const response = await request(app)
      .get('/api/v1/nurse-profile/me/verification')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.verification.isReleasedForMatching).toBe(true);
    expect(response.body.verification.documents).toHaveLength(1);
  });


  it('returns hospital nurse dossier with verified documents only for authorized hospitals', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      publicId: 'NUR-AB12CD34',
      displayName: 'NurseNova',
      firstName: 'Nina',
      lastName: 'Care',
      phoneNumber: '+491701234567',
      minHourlyRate: new Prisma.Decimal(49),
      preferredShiftType: 'FLEXIBLE',
      isReleasedForMatching: true,
      releasedAt: new Date('2026-05-20T10:00:00.000Z'),
      specializations: [{ tag: 'intensivstation' }],
      verificationDocuments: [
        { id: 'doc_1', documentType: VerificationDocumentType.EXAMEN, status: VerificationDocumentStatus.VERIFIED, reviewedAt: new Date('2026-05-20T09:00:00.000Z'), fileUrl: 's3://bucket/examen.pdf' },
        { id: 'doc_2', documentType: VerificationDocumentType.OCCUPATIONAL_HEALTH_CLEARANCE, status: VerificationDocumentStatus.PENDING, reviewedAt: null, fileUrl: 's3://bucket/clearance.pdf' },
      ],
      matchContracts: [
        { id: 'contract_1', jobShift: { id: 'shift_1', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), locationCity: 'Berlin', hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1', clinicName: 'Clinic One' } } },
      ],
    });

    const response = await request(app)
      .get('/api/v1/documents/dossier/nurse_1')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.dossier.verifiedDocuments).toHaveLength(1);
    expect(response.body.dossier.verifiedDocuments[0].documentType).toBe('EXAMEN');
  });

  it('rejects dossier access for unrelated hospitals', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_2', role: UserRole.HOSPITAL_ADMIN });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      publicId: 'NUR-AB12CD34',
      displayName: 'NurseNova',
      firstName: 'Nina',
      lastName: 'Care',
      phoneNumber: '+491701234567',
      minHourlyRate: new Prisma.Decimal(49),
      preferredShiftType: 'FLEXIBLE',
      isReleasedForMatching: true,
      releasedAt: new Date('2026-05-20T10:00:00.000Z'),
      specializations: [],
      verificationDocuments: [],
      matchContracts: [
        { id: 'contract_1', jobShift: { id: 'shift_1', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), locationCity: 'Berlin', hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1', clinicName: 'Clinic One' } } },
      ],
    });

    const response = await request(app)
      .get('/api/v1/documents/dossier/nurse_1')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(403);
  });


  it('creates a contract snapshot when an offer is created', async () => {
    (prisma.jobShift.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'shift_1',
        status: JobShiftStatus.OPEN,
        startTime: new Date('2026-06-16T06:00:00.000Z'),
        endTime: new Date('2026-06-20T18:00:00.000Z'),
        locationCity: 'Berlin',
        hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1', clinicName: 'Clinic One' },
        requirements: [],
        matchContracts: [],
      })
      .mockResolvedValueOnce({ currentSnapshot: null });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_1',
      publicId: 'NUR-AB12CD34',
      displayName: 'NurseNova',
      firstName: 'Nina',
      lastName: 'Care',
      minHourlyRate: new Prisma.Decimal(49),
      phoneNumber: '+491701234567',
      whatsappOptIn: true,
      isReleasedForMatching: true,
      specializations: [],
      availabilityBlocks: [{ id: 'block_1', isBooked: false, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z') }],
    });
    (prisma.matchContract.create as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      invoice: null,
      nurseProfile: { id: 'nurse_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', phoneNumber: '+491701234567', whatsappOptIn: true },
      jobShift: { id: 'shift_1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { clinicName: 'Clinic One', billingAddress: 'Street 1', taxNumber: 'TAX-1' }, requirements: [] },
    });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.PENDING,
      currentSnapshot: null,
      contractSnapshots: [],
      nurseProfile: {
        id: 'nurse_1',
        userId: 'nurse_user_1',
        publicId: 'NUR-AB12CD34',
        displayName: 'NurseNova',
        firstName: 'Nina',
        lastName: 'Care',
        minHourlyRate: new Prisma.Decimal(49),
        specializations: [],
      },
      jobShift: {
        id: 'shift_1',
        externalJobShiftId: 'ext-123',
        title: 'ITS Einsatz',
        department: 'ITS',
        stationName: 'A1',
        locationCity: 'Berlin',
        startTime: new Date('2026-06-16T06:00:00.000Z'),
        endTime: new Date('2026-06-20T18:00:00.000Z'),
        totalPlannedHours: new Prisma.Decimal(12),
        hospitalProfile: { id: 'hospital_1', clinicName: 'Clinic One', billingAddress: 'Street 1', taxNumber: 'TAX-1', userId: 'hospital_owner_1' },
        requirements: [],
      },
    });
    (prisma.contractSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snapshot_1', version: 1, summaryText: 'summary' });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', currentSnapshotId: 'snapshot_1' });

    await matchService.createMatchOffer(
      { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN },
      { jobShiftId: 'shift_1', nurseProfileId: 'nurse_1' },
    );

    expect(prisma.contractSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          matchContractId: 'contract_1',
          version: 1,
          snapshotJson: expect.any(String),
        }),
      }),
    );
  });

  it('returns contract snapshot to authorized parties', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      nurseProfile: { userId: 'nurse_user_1' },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
      currentSnapshot: { id: 'snapshot_1', version: 2, summaryText: 'summary', snapshotJson: JSON.stringify({ commercialTerms: { hospitalPaysNurseDirectly: true } }) },
    });

    const response = await request(app)
      .get('/api/v1/matches/contract/contract_1')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.contractSnapshot.version).toBe(2);
    expect(response.body.contractSnapshot.snapshot.commercialTerms.hospitalPaysNurseDirectly).toBe(true);
  });

  it('creates an invoice amount based on total planned hours times platform fee', async () => {
    const { createInvoiceForSignedContract } = require('../src/services/billing.service');
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({ id: 'contract_2', invoice: null, jobShift: { totalPlannedHours: new Prisma.Decimal(12.5) } });
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 'invoice_1', matchContractId: 'contract_2', amount: new Prisma.Decimal(37.5), status: InvoiceStatus.PENDING });
    const invoice = await createInvoiceForSignedContract('contract_2');
    expect(invoice.amount.toString()).toBe('37.5');
  });
});
