// Redis mocken, bevor der Service importiert wird
const redisStore = new Map<string, string>();

jest.mock('../src/config/redis', () => ({
  redis: {
    get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      redisStore.set(key, value);
    }),
  },
}));

jest.mock('../src/config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { getActiveMedBenefitDeals } from '../src/services/medbenefit.service';

const MOCK_DEALS = [
  {
    id: 1,
    title: '20% auf Fortbildungen',
    partner: 'PflegeCampus',
    description: 'Alle Kurse',
    category: 'FORTBILDUNG' as const,
    discountText: '-20%',
    redemptionInfo: 'Code eingeben',
    validUntil: null,
  },
];

describe('medbenefit.service', () => {
  const ORIGINAL_ENV = process.env;
  const fetchMock = jest.fn();

  beforeAll(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.MOS_SERVICE_TOKEN = 'test-token';
    process.env.MOS_BASE_URL = 'http://mos.test';
    redisStore.clear();
    fetchMock.mockReset();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns null when MOS is not configured', async () => {
    delete process.env.MOS_SERVICE_TOKEN;
    const result = await getActiveMedBenefitDeals();
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches and returns deals from MOS', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ deals: MOCK_DEALS }),
    });
    const result = await getActiveMedBenefitDeals();
    expect(result).toEqual(MOCK_DEALS);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://mos.test/api/v1/mos/deals/active',
      expect.objectContaining({ headers: { 'x-mos-service-token': 'test-token' } }),
    );
  });

  it('serves subsequent calls from cache without refetching', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ deals: MOCK_DEALS }),
    });
    await getActiveMedBenefitDeals();
    const second = await getActiveMedBenefitDeals();
    expect(second).toEqual(MOCK_DEALS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null on MOS error response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const result = await getActiveMedBenefitDeals();
    expect(result).toBeNull();
  });

  it('returns null on network failure (negative cache prevents hammering)', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const first = await getActiveMedBenefitDeals();
    expect(first).toBeNull();
    // Negativ-Cache: zweiter Aufruf geht ohne Fetch
    const second = await getActiveMedBenefitDeals();
    expect(second).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
