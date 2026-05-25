process.env.NODE_ENV = 'test';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    whatsAppEvent: {
      create: jest.fn().mockResolvedValue({ id: 'evt_1' }),
      update: jest.fn().mockResolvedValue({ id: 'evt_1', status: 'DELIVERED' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));
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

import { buildNewMatchOfferWhatsappMessage, sendNewMatchOfferWhatsapp, getWhatsAppEventsForContract } from '../src/services/whatsapp.service';

describe('whatsapp offer messaging', () => {
  it('builds a compact offer message with key details and login link', () => {
    const message = buildNewMatchOfferWhatsappMessage({
      type: 'new-match-offer',
      phoneNumber: '+491701234567',
      matchContractId: 'contract_1',
      displayName: 'NurseNova',
      clinicName: 'Clinic One',
      locationCity: 'Berlin',
      startTime: new Date('2026-06-16T06:00:00.000Z'),
      endTime: new Date('2026-06-20T18:00:00.000Z'),
      loginUrl: 'https://app.shiftlink.example/login',
    });

    expect(message).toContain('NurseNova');
    expect(message).toContain('Clinic One');
    expect(message).toContain('Berlin');
    expect(message).toContain('https://app.shiftlink.example/login');
  });

  it('records a whatsapp event in the database when sending', async () => {
    const { prisma } = require('../src/config/prisma');

    const result = await sendNewMatchOfferWhatsapp({
      type: 'new-match-offer',
      phoneNumber: '+491701234567',
      matchContractId: 'contract_1',
      displayName: 'NurseNova',
      clinicName: 'Clinic One',
      locationCity: 'Berlin',
      startTime: new Date('2026-06-16T06:00:00.000Z'),
      endTime: new Date('2026-06-20T18:00:00.000Z'),
      loginUrl: 'https://app.shiftlink.example/login',
    });

    expect(prisma.whatsAppEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          matchContractId: 'contract_1',
          status: 'QUEUED',
        }),
      }),
    );
    expect(prisma.whatsAppEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DELIVERED',
        }),
      }),
    );
    expect(result.provider).toBe('mock');
    expect(result.accepted).toBe(true);
  });

  it('returns whatsapp events for a contract in descending order', async () => {
    const { prisma } = require('../src/config/prisma');
    prisma.whatsAppEvent.findMany.mockResolvedValue([
      {
        id: 'evt_2',
        eventType: 'new-match-offer',
        phoneNumber: '+491701234567',
        messageText: 'Hallo',
        status: 'DELIVERED',
        attemptCount: 1,
        lastError: null,
        deliveredAt: new Date('2026-05-01'),
        createdAt: new Date('2026-05-01'),
        updatedAt: new Date('2026-05-01'),
      },
      {
        id: 'evt_1',
        eventType: 'new-match-offer',
        phoneNumber: '+491701234567',
        messageText: 'Hallo',
        status: 'QUEUED',
        attemptCount: 0,
        lastError: null,
        deliveredAt: null,
        createdAt: new Date('2026-04-30'),
        updatedAt: new Date('2026-04-30'),
      },
    ]);

    const events = await getWhatsAppEventsForContract('contract_1');

    expect(prisma.whatsAppEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { matchContractId: 'contract_1' },
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('evt_2');
    expect(events[0].status).toBe('DELIVERED');
    expect(events[1].status).toBe('QUEUED');
  });

  it('uses the mock provider adapter successfully', async () => {
    const result = await sendNewMatchOfferWhatsapp({
      type: 'new-match-offer',
      phoneNumber: '+491701234567',
      matchContractId: 'contract_1',
      displayName: 'NurseNova',
      clinicName: 'Clinic One',
      locationCity: 'Berlin',
      startTime: new Date('2026-06-16T06:00:00.000Z'),
      endTime: new Date('2026-06-20T18:00:00.000Z'),
      loginUrl: 'https://app.shiftlink.example/login',
    });

    expect(result.provider).toBe('mock');
    expect(result.accepted).toBe(true);
    expect(result.messageText).toContain('Zum Angebot: https://app.shiftlink.example/login');
  });
});
