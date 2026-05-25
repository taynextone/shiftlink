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
    asyncProcessFailure: { findUnique: jest.fn(), delete: jest.fn() },
  },
}));

jest.mock('../src/config/queues', () => ({
  webhookQueue: { add: jest.fn() },
}));

const { prisma } = require('../src/config/prisma');
const { webhookQueue } = require('../src/config/queues');
const { buildWebhookSignature, createHospitalWebhookEvent, deliverHospitalWebhookEvent, retryWebhookEvent } = require('../src/services/webhook.service');
const { resolveAsyncFailure } = require('../src/services/async-process.service');

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

describe('webhook retry intervention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.webhookEvent.findUnique as jest.Mock).mockReset();
    (prisma.webhookEvent.update as jest.Mock).mockReset();
    (webhookQueue.add as jest.Mock).mockReset();
  });

  it('re-enqueues a failed webhook event and clears the last error', async () => {
    (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 'event_1',
      eventType: 'shift.created',
      payloadJson: '{}',
      deliveredAt: null,
      lastError: 'HTTP 500',
      hospitalProfile: { webhookUrl: 'https://example.com/webhook', webhookSecret: 'secret' },
    });
    (prisma.webhookEvent.update as jest.Mock).mockResolvedValue({ id: 'event_1', deliveredAt: null, lastError: null });

    const result = await retryWebhookEvent('event_1');

    expect(webhookQueue.add).toHaveBeenCalledWith(
      'deliver-webhook-event',
      { webhookEventId: 'event_1' },
      expect.objectContaining({ attempts: 5 }),
    );
    expect(prisma.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'event_1' }, data: { lastError: null } }),
    );
    expect(result.status).toBe('QUEUED');
  });

  it('throws when webhook event is already delivered', async () => {
    (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 'event_1',
      deliveredAt: new Date(),
      hospitalProfile: { webhookUrl: 'https://example.com/webhook', webhookSecret: 'secret' },
    });

    await expect(retryWebhookEvent('event_1')).rejects.toThrow('already been delivered');
  });

  it('throws when webhook destination is not configured', async () => {
    (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
      id: 'event_1',
      deliveredAt: null,
      hospitalProfile: { webhookUrl: null, webhookSecret: null },
    });

    await expect(retryWebhookEvent('event_1')).rejects.toThrow('not configured');
  });
});

describe('async failure resolve intervention', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.asyncProcessFailure.findUnique as jest.Mock).mockReset();
    (prisma.asyncProcessFailure.delete as jest.Mock).mockReset();
  });

  it('deletes the failure record when resolved', async () => {
    (prisma.asyncProcessFailure.findUnique as jest.Mock).mockResolvedValue({ id: 'fail_1', queueName: 'billing' });
    (prisma.asyncProcessFailure.delete as jest.Mock).mockResolvedValue({ id: 'fail_1' });

    const result = await resolveAsyncFailure('fail_1');

    expect(prisma.asyncProcessFailure.delete).toHaveBeenCalledWith({ where: { id: 'fail_1' } });
    expect(result.resolved).toBe(true);
  });

  it('throws when failure record is not found', async () => {
    (prisma.asyncProcessFailure.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(resolveAsyncFailure('unknown')).rejects.toThrow('not found');
  });
});
