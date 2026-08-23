import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('GET /api/v1/health', () => {
  it('returns 200 with status and checks', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('checks');
    expect(['healthy', 'degraded']).toContain(res.body.status);
  });

  it('reports component-level check status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.body.checks).toHaveProperty('database');
    expect(res.body.checks).toHaveProperty('redis');
    // checks are objects: { status: 'ok' | 'error' | 'degraded', latencyMs?, ... }
    expect(['ok', 'error', 'degraded']).toContain(res.body.checks.database.status);
    expect(['ok', 'error', 'degraded']).toContain(res.body.checks.redis.status);
  });

  it('does not cache health responses', async () => {
    const res = await request(app).get('/api/v1/health');
    const cacheControl = res.headers['cache-control'] ?? '';
    // Health endpoints must not be cached long-term; no-store or max-age=0 both qualify.
    expect(
      cacheControl.includes('no-store') ||
      cacheControl.includes('no-cache') ||
      cacheControl.includes('max-age=0'),
    ).toBe(true);
  });
});
