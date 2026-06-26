import { api } from '../api';

describe('api request errors', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('returns parsed JSON from successful requests', async () => {
    const payload = {
      auth: {
        cookieName: 'sid',
        user: { id: 'user-1', email: 'nurse@example.com', role: 'NURSE' },
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
      text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    });
    globalThis.fetch = fetchMock;

    await expect(api.getSession()).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/me', expect.objectContaining({
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
    }));
  });

  it('throws the API message from JSON error responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue(JSON.stringify({ message: 'Session expired' })),
    });

    await expect(api.getSession()).rejects.toThrow('Session expired');
  });

  it('falls back to a status message when the error body is empty', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(''),
    });

    await expect(api.getSession()).rejects.toThrow('Request failed with 400');
  });
});
