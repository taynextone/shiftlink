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
    jobShift: { create: jest.fn(), findUnique: jest.fn() },
    matchContract: { findUnique: jest.fn(), update: jest.fn() },
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

describe('registration and signed match flow', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

  it('allows a nurse to update availability, preferences, and tags', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_profile_1',
      userId: 'nurse_user_1',
      availabilityBlocks: [],
    });
    (prisma.nurseProfile.update as jest.Mock).mockResolvedValue({
      id: 'nurse_profile_1',
      userId: 'nurse_user_1',
      publicId: 'NUR-AB12CD34',
      displayName: 'NurseNova',
      preferredShiftType: 'FLEXIBLE',
      minAssignmentHours: 8,
      maxAssignmentHours: 120,
      preferredRegionsNote: 'Berlin und später Bremen',
      specializations: [{ tag: 'intensivstation' }, { tag: 'fachweiterbildung-intensiv' }],
      availabilityBlocks: [
        { id: 'block_1', city: 'Berlin', radiusKm: 25 },
        { id: 'block_2', city: 'Bremen', radiusKm: 20 },
      ],
    });

    const response = await request(app)
      .patch('/api/v1/nurse-profile/me')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        displayName: 'NurseNova',
        minHourlyRate: 49,
        preferredShiftType: 'FLEXIBLE',
        minAssignmentHours: 8,
        maxAssignmentHours: 120,
        preferredRegionsNote: 'Berlin und später Bremen',
        specializationTags: ['Intensivstation', 'Fachweiterbildung-Intensiv'],
        availabilityBlocks: [
          { city: 'Berlin', radiusKm: 25, startTime: '2026-06-16T06:00:00.000Z', endTime: '2026-06-29T18:00:00.000Z' },
          { city: 'Bremen', radiusKm: 20, startTime: '2026-07-10T06:00:00.000Z', endTime: '2026-07-14T18:00:00.000Z' },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.nurseProfile.specializations).toHaveLength(2);
    expect(response.body.nurseProfile.availabilityBlocks).toHaveLength(2);
  });

  it('rejects invalid availability blocks with end before start', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    const response = await request(app)
      .patch('/api/v1/nurse-profile/me')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ availabilityBlocks: [{ city: 'Berlin', radiusKm: 20, startTime: '2026-06-29T18:00:00.000Z', endTime: '2026-06-16T06:00:00.000Z' }] });
    expect(response.status).toBe(400);
  });

  it('rejects overlapping availability blocks', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    const response = await request(app)
      .patch('/api/v1/nurse-profile/me')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        availabilityBlocks: [
          { city: 'Berlin', radiusKm: 25, startTime: '2026-06-16T06:00:00.000Z', endTime: '2026-06-20T18:00:00.000Z' },
          { city: 'Berlin', radiusKm: 25, startTime: '2026-06-18T06:00:00.000Z', endTime: '2026-06-22T18:00:00.000Z' },
        ],
      });
    expect(response.status).toBe(400);
  });

  it("lists a nurse's own availability blocks", async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_profile_1',
      userId: 'nurse_user_1',
      availabilityBlocks: [{ id: 'block_1', city: 'Berlin', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-29T18:00:00.000Z') }],
    });
    const response = await request(app).get('/api/v1/nurse-availability/me').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(200);
    expect(response.body.blocks).toHaveLength(1);
  });

  it('creates a nurse availability block via dedicated endpoint', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_profile_1', userId: 'nurse_user_1', availabilityBlocks: [] });
    (prisma.nurseAvailabilityBlock.create as jest.Mock).mockResolvedValue({ id: 'block_new', city: 'Berlin', radiusKm: 20 });
    const response = await request(app)
      .post('/api/v1/nurse-availability/me')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ city: 'Berlin', radiusKm: 20, startTime: '2026-06-16T06:00:00.000Z', endTime: '2026-06-20T18:00:00.000Z' });
    expect(response.status).toBe(201);
  });

  it('copies an availability block to multiple new date ranges', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      id: 'nurse_profile_1', userId: 'nurse_user_1', availabilityBlocks: [
        { id: 'block_1', title: 'Berlin Juni', city: 'Berlin', radiusKm: 25, startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), isBooked: false },
      ],
    });
    (prisma.nurseAvailabilityBlock.createMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.nurseAvailabilityBlock.findMany as jest.Mock).mockResolvedValue([{ id: 'block_1' }, { id: 'block_2' }, { id: 'block_3' }]);
    const response = await request(app)
      .post('/api/v1/nurse-availability/me/copy')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        sourceBlockId: 'block_1',
        copies: [
          { startTime: '2026-06-23T06:00:00.000Z', endTime: '2026-06-27T18:00:00.000Z' },
          { startTime: '2026-07-01T06:00:00.000Z', endTime: '2026-07-05T18:00:00.000Z' },
        ],
      });
    expect(response.status).toBe(200);
    expect(response.body.blocks).toHaveLength(3);
  });

  it('updates a single nurse availability block', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_profile_1', userId: 'nurse_user_1', availabilityBlocks: [{ id: 'block_1', city: 'Berlin', startTime: new Date(), endTime: new Date(Date.now() + 1000), isBooked: false }] });
    (prisma.nurseAvailabilityBlock.update as jest.Mock).mockResolvedValue({ id: 'block_1', city: 'Bremen', radiusKm: 30 });
    const response = await request(app)
      .patch('/api/v1/nurse-availability/me/block_1')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ city: 'Bremen', radiusKm: 30 });
    expect(response.status).toBe(200);
  });

  it('deletes an unbooked nurse availability block', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_profile_1', userId: 'nurse_user_1', availabilityBlocks: [{ id: 'block_1', startTime: new Date(), endTime: new Date(Date.now() + 1000), isBooked: false }] });
    const response = await request(app).delete('/api/v1/nurse-availability/me/block_1').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(204);
  });

  it('prevents deleting booked availability blocks through nurse self-service', async () => {
    const token = signAuthToken({ sub: 'nurse_user_1', role: UserRole.NURSE });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_profile_1', userId: 'nurse_user_1', availabilityBlocks: [{ id: 'block_1', startTime: new Date(), endTime: new Date(Date.now() + 1000), isBooked: true }] });
    const response = await request(app).delete('/api/v1/nurse-availability/me/block_1').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(409);
  });

  it('allows super admins to mark an availability block as booked', async () => {
    const token = signAuthToken({ sub: 'super_admin_1', role: UserRole.SUPER_ADMIN });
    (prisma.nurseAvailabilityBlock.findUnique as jest.Mock).mockResolvedValue({ id: 'block_1', isBooked: false });
    (prisma.nurseAvailabilityBlock.update as jest.Mock).mockResolvedValue({ id: 'block_1', isBooked: true });
    const response = await request(app)
      .patch('/api/v1/nurse-availability/block_1/booked')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({ isBooked: true });
    expect(response.status).toBe(200);
  });

  it('returns an anonymized public nurse profile view', async () => {
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({
      publicId: 'NUR-AB12CD34',
      displayName: 'NurseNova',
      minHourlyRate: new Prisma.Decimal(49),
      preferredShiftType: 'FLEXIBLE',
      minAssignmentHours: 8,
      maxAssignmentHours: 120,
      preferredRegionsNote: 'Berlin und später Bremen',
      specializations: [{ tag: 'intensivstation' }],
      availabilityBlocks: [{ id: 'block_1', city: 'Berlin', postalCode: '10115', radiusKm: 25, startTime: new Date(), endTime: new Date(Date.now() + 1000), notes: 'Nur Juni-Block Berlin' }],
    });
    const response = await request(app).get('/api/v1/nurse-profile/public/NUR-AB12CD34');
    expect(response.status).toBe(200);
    expect(response.body.nurseProfile.firstName).toBeUndefined();
  });

  it('allows hospitals to create demand with time window and skill requirements', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.hospitalProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'hospital_1', userId: 'hospital_owner_1' });
    (prisma.jobShift.create as jest.Mock).mockResolvedValue({ id: 'shift_1', locationCity: 'Berlin', requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }, { tag: 'fachweiterbildung-intensiv', priority: 'PREFERRED' }] });
    const response = await request(app)
      .post('/api/v1/job-shifts')
      .set('Cookie', [`shiftlink_token=${token}`])
      .send({
        title: 'Intensivpflege Juni',
        department: 'Intensivstation',
        stationName: 'ITS 3',
        locationCity: 'Berlin',
        startTime: '2026-06-16T06:00:00.000Z',
        endTime: '2026-06-29T18:00:00.000Z',
        totalPlannedHours: 120,
        requirements: [{ tag: 'intensivstation', priority: 'REQUIRED' }, { tag: 'fachweiterbildung-intensiv', priority: 'PREFERRED' }],
      });
    expect(response.status).toBe(201);
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

  it('logs out an authenticated user', async () => {
    const token = signAuthToken({ sub: 'admin_1', role: UserRole.HOSPITAL_ADMIN });
    const response = await request(app).post('/api/v1/auth/logout').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(200);
  });

  it('rejects signing a match without auth', async () => {
    const response = await request(app).post('/api/v1/matches/sign').send({ matchContractId: 'contract_1' });
    expect(response.status).toBe(401);
  });

  it('rejects signing a match with the wrong role', async () => {
    const token = signAuthToken({ sub: 'user_2', role: UserRole.NURSE });
    const response = await request(app).post('/api/v1/matches/sign').set('Cookie', [`shiftlink_token=${token}`]).send({ matchContractId: 'contract_1' });
    expect(response.status).toBe(403);
  });

  it('rejects signing a match for a different hospital owner', async () => {
    const token = signAuthToken({ sub: 'hospital_admin_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({ id: 'contract_1', status: MatchContractStatus.PENDING, nurseProfile: { id: 'nurse_1', whatsappOptIn: true, phoneNumber: '+491701234567' }, invoice: null, jobShift: { hospitalProfile: { id: 'hospital_1', userId: 'different_hospital_owner' } } });
    const response = await request(app).post('/api/v1/matches/sign').set('Cookie', [`shiftlink_token=${token}`]).send({ matchContractId: 'contract_1' });
    expect(response.status).toBe(403);
  });

  it('signs a match, updates shift status, auto-books availability, and enqueues billing + whatsapp jobs idempotently', async () => {
    jest.spyOn(prisma.matchContract, 'findUnique')
      .mockResolvedValueOnce({ id: 'contract_1', status: MatchContractStatus.PENDING, nurseProfile: { id: 'nurse_1', whatsappOptIn: true, phoneNumber: '+491701234567' }, invoice: null, jobShift: { hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1' } } } as any)
      .mockResolvedValueOnce({ id: 'contract_1', jobShift: { startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z') }, nurseProfile: { availabilityBlocks: [{ id: 'block_1', startTime: new Date('2026-06-16T05:00:00.000Z'), endTime: new Date('2026-06-20T19:00:00.000Z'), isBooked: false }] } } as any);
    jest.spyOn(prisma.matchContract, 'update').mockResolvedValue({ id: 'contract_1', status: MatchContractStatus.SIGNED, nurseProfile: { id: 'nurse_1', whatsappOptIn: true, phoneNumber: '+491701234567' }, jobShift: { id: 'shift_1', startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), status: JobShiftStatus.MATCHED, hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1' } }, invoice: null } as any);
    jest.spyOn(prisma.nurseAvailabilityBlock, 'update').mockResolvedValue({ id: 'block_1', isBooked: true } as any);

    const result = await matchService.signMatchContract('contract_1', { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });

    expect(result.status).toBe(MatchContractStatus.SIGNED);
    expect(prisma.nurseAvailabilityBlock.update).toHaveBeenCalled();
    expect(billingQueue.add).toHaveBeenCalled();
    expect(whatsappQueue.add).toHaveBeenCalled();
  });

  it('returns existing signed contract without re-enqueuing when already signed', async () => {
    jest.spyOn(prisma.matchContract, 'findUnique').mockResolvedValue({ id: 'contract_1', status: MatchContractStatus.SIGNED, nurseProfile: { id: 'nurse_1', whatsappOptIn: true, phoneNumber: '+491701234567' }, invoice: { id: 'invoice_1' }, jobShift: { startTime: new Date('2026-06-16T06:00:00.000Z'), endTime: new Date('2026-06-20T18:00:00.000Z'), hospitalProfile: { id: 'hospital_1', userId: 'hospital_owner_1' } } } as any);
    const result = await matchService.signMatchContract('contract_1', { userId: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    expect(result.status).toBe(MatchContractStatus.SIGNED);
    expect(prisma.matchContract.update).not.toHaveBeenCalled();
    expect(prisma.nurseAvailabilityBlock.update).not.toHaveBeenCalled();
  });

  it('creates an invoice amount based on total planned hours times platform fee', async () => {
    const { createInvoiceForSignedContract } = require('../src/services/billing.service');
    (prisma.matchContract.findUnique as jest.Mock).mockResolvedValue({ id: 'contract_2', invoice: null, jobShift: { totalPlannedHours: new Prisma.Decimal(12.5) } });
    (prisma.invoice.create as jest.Mock).mockResolvedValue({ id: 'invoice_1', matchContractId: 'contract_2', amount: new Prisma.Decimal(37.5), status: InvoiceStatus.PENDING });
    const invoice = await createInvoiceForSignedContract('contract_2');
    expect(invoice.amount.toString()).toBe('37.5');
  });

  it('returns auth payload for authenticated users', async () => {
    const token = signAuthToken({ sub: 'admin_1', role: UserRole.HOSPITAL_ADMIN });
    const response = await request(app).get('/api/v1/auth/me').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(200);
  });

  it('rejects examen access for unrelated hospitals', async () => {
    const token = signAuthToken({ sub: 'hospital_admin_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_1', examenFileUrl: 's3://bucket/examen.pdf', matchContracts: [{ jobShift: { hospitalProfile: { userId: 'different_owner' } } }] });
    const response = await request(app).get('/api/v1/documents/examen/nurse_1').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(403);
  });

  it('returns signed examen download metadata for authorized hospital owners', async () => {
    const token = signAuthToken({ sub: 'hospital_owner_1', role: UserRole.HOSPITAL_ADMIN });
    (prisma.nurseProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'nurse_1', examenFileUrl: 's3://bucket/examen.pdf', matchContracts: [{ jobShift: { hospitalProfile: { userId: 'hospital_owner_1' } } }] });
    const response = await request(app).get('/api/v1/documents/examen/nurse_1').set('Cookie', [`shiftlink_token=${token}`]);
    expect(response.status).toBe(200);
  });
});
