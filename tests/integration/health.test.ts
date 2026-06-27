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
    expect(['up', 'down']).toContain(res.body.checks.database);
    expect(['up', 'down']).toContain(res.body.checks.redis);
  });

  it('returns cache-control no-store header', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['cache-control']).toContain('no-store');
  });
});
