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

jest.mock('../src/config/prisma', () => ({
  prisma: {
    webhookEvent: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  },
}));

jest.mock('../src/config/queues', () => ({
  webhookQueue: { add: jest.fn() },
}));

const { prisma } = require('../src/config/prisma');
const { webhookQueue } = require('../src/config/queues');
const { buildWebhookSignature, createHospitalWebhookEvent, deliverHospitalWebhookEvent } = require('../src/services/webhook.service');

describe('webhook delivery flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.webhookEvent.create as jest.Mock).mockReset();
    (prisma.webhookEvent.findUnique as jest.Mock).mockReset();
    (prisma.webhookEvent.update as jest.Mock).mockReset();
    (webhookQueue.add as jest.Mock).mockReset();
  });

  it('creates an outbox event and enqueues delivery with retry policy', async () => {
    (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'event_1' });

    const event = await createHospitalWebhookEvent({
      hospitalProfileId: 'hospital_1',
      eventType: 'shift.created',
      payload: { jobShiftId: 'shift_1' },
    });

    expect(event.id).toBe('event_1');
    expect(webhookQueue.add).toHaveBeenCalledWith(
      'deliver-webhook-event',
      { webhookEventId: 'event_1' },
      expect.objectContaining({ jobId: 'webhook-event:event_1', attempts: 5 }),
    );
  });

  it('builds stable webhook signatures', () => {
    const signature = buildWebhookSignature('{"ok":true}', 'secret');
    expect(signature).toHaveLength(64);
  });

  it('marks webhook delivered on successful HTTP response', async () => {
    (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 'event_1',
      eventType: 'shift.created',
      payloadJson: '{"jobShiftId":"shift_1"}',
      hospitalProfile: { webhookUrl: 'https://example.com/webhook', webhookSecret: 'secret' },
    });
    (prisma.webhookEvent.update as jest.Mock).mockResolvedValue({ id: 'event_1' });
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;

    await deliverHospitalWebhookEvent('event_1');

    expect(prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'event_1' },
        data: expect.objectContaining({ deliveredAt: expect.any(Date), lastError: null }),
      }),
    );
  });
});
