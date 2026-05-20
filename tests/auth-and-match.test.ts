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
    ContractExecutionStatus: {
      DRAFT: 'DRAFT',
      PENDING_HOSPITAL_SIGNATURE: 'PENDING_HOSPITAL_SIGNATURE',
      PENDING_NURSE_SIGNATURE: 'PENDING_NURSE_SIGNATURE',
      FULLY_EXECUTED: 'FULLY_EXECUTED',
      VOIDED: 'VOIDED',
    },
    ContractSignerRole: {
      HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
      NURSE: 'NURSE',
      SUPER_ADMIN: 'SUPER_ADMIN',
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
    matchContract: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), delete: jest.fn() },
    contractSnapshot: { create: jest.fn() },
    contractSignatureEvent: { create: jest.fn() },
    contractVoidEvent: { create: jest.fn() },
    invoice: { create: jest.fn(), findMany: jest.fn() },
    webhookEvent: { create: jest.fn() },
  },
}));

jest.mock('../src/config/queues', () => ({
  billingQueue: { add: jest.fn() },
  whatsappQueue: { add: jest.fn() },
  webhookQueue: { add: jest.fn() },
}));

jest.mock('../src/services/contract.service', () => ({
  ...jest.requireActual('../src/services/contract.service'),
  createContractSnapshot: jest.fn(async () => ({ id: 'snapshot_2', version: 2, summaryText: 'summary', snapshotJson: SNAPSHOT_JSON })),
  ensureContractSnapshotForOffer: jest.fn(async () => ({ id: 'snapshot_1', version: 1, summaryText: 'summary', snapshotJson: SNAPSHOT_JSON })),
}));

jest.mock('../src/services/contract-webhook.service', () => ({
  emitContractPdfGeneratedEvent: jest.fn(async () => ({ id: 'webhook_pdf' })),
  emitMatchOfferSignedEvent: jest.fn(async () => ({ id: 'webhook_signed' })),
  emitContractExecutionSignedEvent: jest.fn(async () => ({ id: 'webhook_exec_signed' })),
  emitContractFullyExecutedEvent: jest.fn(async () => ({ id: 'webhook_exec_full' })),
  emitContractVoidedEvent: jest.fn(async () => ({ id: 'webhook_voided' })),
}));

jest.mock('../src/services/storage.service', () => ({
  createSignedDownloadUrl: jest.fn(async (fileUrl: string) => ({
    url: `https://signed.example.com/download?file=${encodeURIComponent(fileUrl)}`,
    expiresIn: 900,
    objectKey: 'examen.pdf',
  })),
  uploadPrivateTextFile: jest.fn(async ({ objectKey }: { objectKey: string }) => ({
    fileUrl: `s3://shiftlink-private/${objectKey}`,
    objectKey,
  })),
}));

const { createApp } = require('../src/app');
const { prisma } = require('../src/config/prisma');
const { billingQueue, whatsappQueue, webhookQueue } = require('../src/config/queues');
const matchService = require('../src/services/match.service');
const { uploadPrivateTextFile } = require('../src/services/storage.service');
const {
  emitContractPdfGeneratedEvent,
  emitMatchOfferSignedEvent,
  emitContractExecutionSignedEvent,
  emitContractFullyExecutedEvent,
  emitContractVoidedEvent,
} = require('../src/services/contract-webhook.service');
const { createContractSnapshot, ensureContractSnapshotForOffer } = require('../src/services/contract.service');

const SNAPSHOT_JSON = JSON.stringify({
  matchContractId: 'contract_1',
  version: 2,
  platform: { role: 'vermittlung-und-matching-plattform', isEmployer: false, isStaffingAgency: false, handlesPayroll: false, platformFeePerHour: '3.00' },
  hospital: { clinicName: 'Clinic One', billingAddress: 'Street 1', taxNumber: 'TAX-1' },
  nurse: { displayName: 'NurseNova', firstName: 'Nina', lastName: 'Care', minHourlyRate: '49', specializations: [] },
  jobShift: { title: 'ITS Einsatz', department: 'ITS', stationName: 'A1', locationCity: 'Berlin', startTime: '2026-06-16T06:00:00.000Z', endTime: '2026-06-20T18:00:00.000Z', totalPlannedHours: '12' },
  commercialTerms: { invoiceTrigger: 'digital-signature', noRefundPolicy: true, hospitalPaysNurseDirectly: true, platformIssuesServiceFeeInvoiceOnly: true },
});

function resetAllMocks() {
  jest.clearAllMocks();
  Object.values(prisma).forEach((group: any) => {
    if (group && typeof group === 'object') {
      Object.values(group).forEach((fn: any) => {
        if (fn && typeof fn.mockReset === 'function') {
          fn.mockReset();
        }
      });
    }
  });
  (billingQueue.add as jest.Mock).mockReset();
  (whatsappQueue.add as jest.Mock).mockReset();
  (webhookQueue.add as jest.Mock).mockReset();
  (uploadPrivateTextFile as jest.Mock).mockReset();
  (uploadPrivateTextFile as jest.Mock).mockImplementation(async ({ objectKey }: { objectKey: string }) => ({
    fileUrl: `s3://shiftlink-private/${objectKey}`,
    objectKey,
  }));
  (emitContractPdfGeneratedEvent as jest.Mock).mockClear();
  (emitMatchOfferSignedEvent as jest.Mock).mockClear();
  (emitContractExecutionSignedEvent as jest.Mock).mockClear();
  (emitContractFullyExecutedEvent as jest.Mock).mockClear();
  (emitContractVoidedEvent as jest.Mock).mockClear();
  (createContractSnapshot as jest.Mock).mockClear();
  (ensureContractSnapshotForOffer as jest.Mock).mockClear();
}

describe('hospital integration and scalable match flow', () => {
  const app = createApp();

  beforeEach(() => {
    resetAllMocks();
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
    (prisma.contractSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snapshot_1', version: 1, summaryText: 'summary', snapshotJson: SNAPSHOT_JSON });

    const result = await matchService.createMatchOffer(
      { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN },
      { jobShiftId: 'shift_1', nurseProfileId: 'nurse_1' },
    );

    expect(result.status).toBe(MatchContractStatus.PENDING);
    expect(prisma.matchContract.create).toHaveBeenCalled();
    expect(whatsappQueue.add).toHaveBeenCalled();
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
    (prisma.contractSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snapshot_1', version: 1, summaryText: 'summary', snapshotJson: SNAPSHOT_JSON });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', currentSnapshotId: 'snapshot_1' });

    await matchService.createMatchOffer(
      { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN },
      { jobShiftId: 'shift_1', nurseProfileId: 'nurse_1' },
    );

    expect(ensureContractSnapshotForOffer).toHaveBeenCalledWith('contract_1');
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

  it('generates contract PDF artifact on contract signing', async () => {
    const sequence = [
      {
        id: 'contract_1',
        status: MatchContractStatus.PENDING,
        nurseProfileId: 'nurse_1',
        nurseProfile: { id: 'nurse_1', userId: 'nurse_user_1' },
        jobShift: { id: 'shift_1', hospitalProfile: { userId: 'hospital_owner_1' } },
        invoice: null,
      },
      {
        id: 'contract_1',
        status: MatchContractStatus.SIGNED,
        contractSnapshots: [{ version: 1 }],
        nurseProfile: { id: 'nurse_1', userId: 'nurse_user_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', firstName: 'Nina', lastName: 'Care', minHourlyRate: new Prisma.Decimal(49), specializations: [] },
        jobShift: { id: 'shift_1', externalJobShiftId: 'ext-123', title: 'ITS Einsatz', department: 'ITS', stationName: 'A1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), totalPlannedHours: new Prisma.Decimal(12), hospitalProfile: { id: 'hospital_1', clinicName: 'Clinic One', billingAddress: 'Street 1', taxNumber: 'TAX-1', userId: 'hospital_owner_1' }, requirements: [] },
        invoice: null,
      },
      { id: 'contract_1', currentSnapshot: { id: 'snapshot_2', version: 2, snapshotJson: SNAPSHOT_JSON } },
      {
        id: 'contract_1',
        nurseProfile: { id: 'nurse_1', availabilityBlocks: [{ id: 'block_1', nurseProfileId: 'nurse_1', title: null, city: 'Berlin', postalCode: null, latitude: null, longitude: null, radiusKm: 25, notes: null, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z'), isBooked: false }] },
        jobShift: { id: 'shift_1', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z') },
      },
    ];
    let i = 0;
    (prisma.matchContract.findUnique as jest.Mock).mockImplementation(() => Promise.resolve(sequence[i++]));
    (prisma.matchContract.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.jobShift.update as jest.Mock).mockResolvedValue({ id: 'shift_1', status: JobShiftStatus.MATCHED });
    (prisma.contractSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snapshot_2', version: 2, summaryText: 'summary', snapshotJson: SNAPSHOT_JSON });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', status: MatchContractStatus.SIGNED, contractPdfUrl: 's3://shiftlink-private/contracts/contract_1/v2.pdf' });
    (prisma.nurseAvailabilityBlock.update as jest.Mock).mockResolvedValue({ id: 'block_1' });

    await matchService.signMatchContract('contract_1', { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });

    expect(uploadPrivateTextFile).toHaveBeenCalledWith(expect.objectContaining({ objectKey: 'contracts/contract_1/v2.pdf', contentType: 'application/pdf' }));
  });

  it('returns contract PDF download for authorized parties', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      contractPdfUrl: 's3://shiftlink-private/contracts/contract_1/v2.pdf',
      nurseProfile: { userId: 'nurse_user_1' },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
    });

    const response = await request(app)
      .get('/api/v1/matches/contract/contract_1/pdf')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.contractPdf.signedUrl ?? response.body.contractPdf.url).toContain('signed.example.com');
  });

  it('records hospital execution signature and waits for nurse signature', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.SIGNED,
      nurseProfile: { id: 'nurse_1', userId: 'nurse_user_1', user: { id: 'nurse_user_1' } },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
      currentSnapshot: { id: 'snapshot_1' },
      signatureEvents: [],
    });
    (prisma.contractSignatureEvent.create as jest.Mock).mockResolvedValue({ id: 'sig_1', signerUserId: 'hospital_owner_1', signerRole: 'HOSPITAL_ADMIN', createdAt: new Date('2026-05-20T12:00:00.000Z') });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', executionStatus: 'PENDING_NURSE_SIGNATURE', fullyExecutedAt: null, signatureEvents: [{ id: 'sig_1' }] });

    const response = await request(app)
      .post('/api/v1/matches/contract/contract_1/execution/sign')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.execution.executionStatus).toBe('PENDING_NURSE_SIGNATURE');
  });

  it('fully executes contract after nurse signature and regenerates artifact', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.matchContract.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'contract_1',
        status: MatchContractStatus.SIGNED,
        nurseProfile: { id: 'nurse_1', userId: 'nurse_user_1', user: { id: 'nurse_user_1' } },
        jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
        currentSnapshot: { id: 'snapshot_2', version: 2, snapshotJson: SNAPSHOT_JSON },
        signatureEvents: [{ id: 'sig_1', signerUserId: 'hospital_owner_1', signerRole: 'HOSPITAL_ADMIN' }],
      })
      .mockResolvedValueOnce({
        id: 'contract_1',
        contractPdfUrl: 's3://shiftlink-private/contracts/contract_1/v2.pdf',
        nurseProfile: { userId: 'nurse_user_1' },
        jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
        currentSnapshot: { id: 'snapshot_2', version: 2, snapshotJson: SNAPSHOT_JSON },
      });
    (prisma.contractSignatureEvent.create as jest.Mock).mockResolvedValue({ id: 'sig_2', signerUserId: 'nurse_user_1', signerRole: 'NURSE', createdAt: new Date('2026-05-20T12:05:00.000Z') });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', executionStatus: 'FULLY_EXECUTED', fullyExecutedAt: new Date('2026-05-20T12:05:00.000Z'), signatureEvents: [{ id: 'sig_1' }, { id: 'sig_2' }] });

    const response = await request(app)
      .post('/api/v1/matches/contract/contract_1/execution/sign')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.execution.executionStatus).toBe('FULLY_EXECUTED');
    expect(uploadPrivateTextFile).toHaveBeenCalled();
  });

  it('returns contract execution overview to authorized actor', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      executionStatus: 'PENDING_NURSE_SIGNATURE',
      fullyExecutedAt: null,
      nurseProfile: { userId: 'nurse_user_1' },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
      signatureEvents: [{ id: 'sig_1', signerUserId: 'hospital_owner_1', signerRole: 'HOSPITAL_ADMIN', signatureIntent: 'EXECUTE_CONTRACT', createdAt: new Date('2026-05-20T12:00:00.000Z') }],
    });

    const response = await request(app)
      .get('/api/v1/matches/contract/contract_1/execution')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.execution.signatureEvents).toHaveLength(1);
  });

  it('voids a non-fully-executed contract with audit trail', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.SIGNED,
      executionStatus: 'PENDING_NURSE_SIGNATURE',
      nurseProfile: { userId: 'nurse_user_1' },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
      signatureEvents: [{ id: 'sig_1' }],
      voidEvent: null,
      invoice: { status: 'PENDING' },
    });
    (prisma.contractVoidEvent.create as jest.Mock).mockResolvedValue({ id: 'void_1', actorUserId: 'hospital_owner_1', actorRole: 'HOSPITAL_ADMIN', reason: 'Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.', createdAt: new Date('2026-05-20T12:20:00.000Z') });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', status: 'CANCELED', executionStatus: 'VOIDED', voidEvent: { reason: 'Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.', createdAt: new Date('2026-05-20T12:20:00.000Z') } });

    const response = await request(app)
      .post('/api/v1/matches/contract/contract_1/void')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ reason: 'Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.' });

    expect(response.status).toBe(200);
    expect(response.body.voiding.executionStatus).toBe('VOIDED');
  });

  it('rejects voiding for fully executed contracts', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: MatchContractStatus.SIGNED,
      executionStatus: 'FULLY_EXECUTED',
      nurseProfile: { userId: 'nurse_user_1' },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
      signatureEvents: [{ id: 'sig_1' }, { id: 'sig_2' }],
      voidEvent: null,
      invoice: { status: 'PENDING' },
    });

    const response = await request(app)
      .post('/api/v1/matches/contract/contract_1/void')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ reason: 'Dieser Vertrag darf nach vollständiger Ausführung nicht mehr aufgehoben werden.' });

    expect(response.status).toBe(409);
  });

  it('returns contract void overview to authorized actor', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: 'CANCELED',
      executionStatus: 'VOIDED',
      nurseProfile: { userId: 'nurse_user_1' },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
      voidEvent: { actorUserId: 'hospital_owner_1', actorRole: 'HOSPITAL_ADMIN', reason: 'Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.', createdAt: new Date('2026-05-20T12:20:00.000Z') },
    });

    const response = await request(app)
      .get('/api/v1/matches/contract/contract_1/void')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.voiding.voidEvent.reason).toContain('nicht wahrnehmen');
  });

  it('returns contract lifecycle overview to authorized actor', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      status: 'CANCELED',
      executionStatus: 'VOIDED',
      createdAt: new Date('2026-05-20T10:00:00.000Z'),
      updatedAt: new Date('2026-05-20T12:20:00.000Z'),
      expiresAt: new Date('2026-05-21T10:00:00.000Z'),
      respondedAt: new Date('2026-05-20T11:00:00.000Z'),
      signedAt: new Date('2026-05-20T11:05:00.000Z'),
      fullyExecutedAt: null,
      contractPdfUrl: 's3://shiftlink-private/contracts/contract_1/v2.pdf',
      nurseProfile: { id: 'nurse_1', userId: 'nurse_user_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova' },
      jobShift: { hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1', clinicName: 'Clinic One' } },
      contractSnapshots: [
        { id: 'snapshot_1', version: 1, createdAt: new Date('2026-05-20T10:05:00.000Z'), summaryText: 'Offer snapshot' },
        { id: 'snapshot_2', version: 2, createdAt: new Date('2026-05-20T11:05:00.000Z'), summaryText: 'Signed snapshot' },
      ],
      currentSnapshot: { id: 'snapshot_2', version: 2 },
      signatureEvents: [{ id: 'sig_1', signerUserId: 'hospital_owner_1', signerRole: 'HOSPITAL_ADMIN', signatureIntent: 'EXECUTE_CONTRACT', snapshotId: 'snapshot_2', createdAt: new Date('2026-05-20T11:10:00.000Z') }],
      voidEvent: { id: 'void_1', actorUserId: 'hospital_owner_1', actorRole: 'HOSPITAL_ADMIN', reason: 'Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.', createdAt: new Date('2026-05-20T12:20:00.000Z') },
      invoice: { id: 'invoice_1', status: 'PENDING', amount: new Prisma.Decimal(36), invoicePdfUrl: null },
    });

    const response = await request(app)
      .get('/api/v1/matches/contract/contract_1/lifecycle')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(200);
    expect(response.body.lifecycle.snapshotSummary.totalSnapshots).toBe(2);
    expect(response.body.lifecycle.signatureSummary.totalSignatures).toBe(1);
    expect(response.body.lifecycle.voidSummary.reason).toContain('nicht wahrnehmen');
  });

  it('rejects lifecycle overview for unrelated actor', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_2', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({
      id: 'contract_1',
      nurseProfile: { userId: 'nurse_user_1' },
      jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } },
      contractSnapshots: [],
      currentSnapshot: null,
      signatureEvents: [],
      voidEvent: null,
      invoice: null,
    });

    const response = await request(app)
      .get('/api/v1/matches/contract/contract_1/lifecycle')
      .set('Cookie', [`shiftlink_token=${token}`]);

    expect(response.status).toBe(403);
  });

  it('emits contract lifecycle webhook events on match signing', async () => {
    const sequence = [
      {
        id: 'contract_1',
        status: MatchContractStatus.PENDING,
        nurseProfile: { id: 'nurse_1', userId: 'nurse_user_1' },
        jobShift: { id: 'shift_1', hospitalProfile: { userId: 'hospital_owner_1' } },
        invoice: null,
      },
      {
        id: 'contract_1',
        status: MatchContractStatus.SIGNED,
        contractSnapshots: [{ version: 1 }],
        nurseProfile: { id: 'nurse_1', userId: 'nurse_user_1', publicId: 'NUR-AB12CD34', displayName: 'NurseNova', firstName: 'Nina', lastName: 'Care', minHourlyRate: new Prisma.Decimal(49), specializations: [] },
        jobShift: { id: 'shift_1', externalJobShiftId: 'ext-123', title: 'ITS Einsatz', department: 'ITS', stationName: 'A1', locationCity: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), totalPlannedHours: new Prisma.Decimal(12), hospitalProfile: { id: 'hospital_1', clinicName: 'Clinic One', billingAddress: 'Street 1', taxNumber: 'TAX-1', userId: 'hospital_owner_1' }, requirements: [] },
        invoice: null,
      },
      { id: 'contract_1', currentSnapshot: { id: 'snapshot_2', version: 2, snapshotJson: SNAPSHOT_JSON } },
      {
        id: 'contract_1',
        nurseProfile: { id: 'nurse_1', availabilityBlocks: [{ id: 'block_1', nurseProfileId: 'nurse_1', title: null, city: 'Berlin', postalCode: null, latitude: null, longitude: null, radiusKm: 25, notes: null, startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z'), isBooked: false }] },
        jobShift: { id: 'shift_1', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z') },
      },
    ];
    let i = 0;
    (prisma.matchContract.findUnique as jest.Mock).mockImplementation(() => Promise.resolve(sequence[i++]));
    (prisma.matchContract.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.jobShift.update as jest.Mock).mockResolvedValue({ id: 'shift_1', status: JobShiftStatus.MATCHED });
    (prisma.contractSnapshot.create as jest.Mock).mockResolvedValue({ id: 'snapshot_2', version: 2, summaryText: 'summary', snapshotJson: SNAPSHOT_JSON });
    (prisma.matchContract.update as jest.Mock).mockResolvedValue({ id: 'contract_1', status: MatchContractStatus.SIGNED, invoice: null });
    (prisma.nurseAvailabilityBlock.update as jest.Mock).mockResolvedValue({ id: 'block_1' });

    await matchService.signMatchContract('contract_1', { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });

    expect(emitMatchOfferSignedEvent).toHaveBeenCalledWith('contract_1');
    expect(emitContractPdfGeneratedEvent).toHaveBeenCalledWith('contract_1');
  });

  it('creates an invoice amount based on total planned hours times platform fee', async () => {
    const { createInvoiceForSignedContract } = require('../src/services/billing.service');
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({ id: 'contract_2', invoice: null, jobShift: { totalPlannedHours: new Prisma.Decimal(12.5) } });
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 'invoice_1', matchContractId: 'contract_2', amount: new Prisma.Decimal(37.5), status: InvoiceStatus.PENDING });
    const invoice = await createInvoiceForSignedContract('contract_2');
    expect(invoice.amount.toString()).toBe('37.5');
  });
});
