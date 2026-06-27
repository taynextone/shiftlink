import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

describe('POST /api/v1/auth/login', () => {
  it('rejects request body with missing password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('code');
  });

  it('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('rejects short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'doesnotexist@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/register', () => {
  it('rejects invalid registration payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ role: 'INVALID' });
    expect(res.status).toBe(400);
  });

  it('requires password for registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'nurse@example.com', role: 'NURSE' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email for nurse registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'invalid', role: 'NURSE', password: 'password123', fullName: 'Test Nurse' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });
});
