const redisStore = new Map<string, string>();
const redisGet = jest.fn(async (key: string) => redisStore.get(key) ?? null);
const redisSet = jest.fn(async (key: string, value: string) => {
  redisStore.set(key, value);
});
const redisDel = jest.fn(async (key: string) => {
  redisStore.delete(key);
});

jest.mock('../src/config/redis', () => ({
  __esModule: true,
  default: { get: redisGet, set: redisSet, del: redisDel },
  redis: { get: redisGet, set: redisSet, del: redisDel },
}));

import { getQualipassStatus, invalidateQualipassCache } from '../src/services/qualipass.service';

describe('qualipass.service MOS bridge', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      MOS_BASE_URL: 'http://mos.test/',
      MOS_SERVICE_TOKEN: 'service-token-123456',
    };
    redisStore.clear();
    redisGet.mockClear();
    redisSet.mockClear();
    redisDel.mockClear();
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('returns null without a linked MOS account', async () => {
    await expect(getQualipassStatus(null)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches a verified status with the service token and caches it', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'VERIFIED' }),
    });

    await expect(getQualipassStatus(42)).resolves.toBe('VERIFIED');
    await expect(getQualipassStatus(42)).resolves.toBe('VERIFIED');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://mos.test/api/v1/mos/qualipass/status/42',
      expect.objectContaining({
        headers: { 'x-mos-service-token': 'service-token-123456' },
      }),
    );
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringMatching(/^qualipass:/),
      'VERIFIED',
      'EX',
      15 * 60,
    );
  });

  it('negative-caches a MOS outage to prevent repeated requests', async () => {
    fetchMock.mockRejectedValue(new Error('MOS unavailable'));

    await expect(getQualipassStatus(42)).resolves.toBeNull();
    await expect(getQualipassStatus(42)).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringMatching(/^qualipass:/),
      '__down__',
      'EX',
      5 * 60,
    );
  });

  it('invalidates the cached status after account changes', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ status: 'UNVERIFIED' }) });
    await getQualipassStatus(42);

    await invalidateQualipassCache(42);

    expect(redisDel).toHaveBeenCalledWith(expect.stringMatching(/^qualipass:/));
  });
});
