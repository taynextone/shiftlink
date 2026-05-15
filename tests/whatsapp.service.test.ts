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

import { buildNewMatchOfferWhatsappMessage, sendNewMatchOfferWhatsapp } from '../src/services/whatsapp.service';

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
