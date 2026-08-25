import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * MedBenefit-Deals (Stufe A, siehe docs/MEDBENEFIT-INTEGRATION.md).
 *
 * Holt die aktiven Deals aus MOS-Core (Service-to-Service) und cached sie
 * in Redis — gleiche Mechanik wie qualipass.service. Bei MOS-Ausfall wird
 * ein negativer Kurzzeit-Cache gesetzt, damit das Dashboard nicht pro
 * Request wartet.
 */

const CACHE_KEY = 'medbenefit:deals:active';
const CACHE_TTL_SECONDS = 600; // 10 Minuten
const NEGATIVE_TTL_SECONDS = 60;

export type MedBenefitDeal = {
  id: number;
  title: string;
  partner: string;
  description: string;
  category: 'FORTBILDUNG' | 'VERSICHERUNG' | 'EQUIPMENT' | 'SONSTIGES';
  discountText: string;
  redemptionInfo: string | null;
  validUntil: string | null;
};

export async function getActiveMedBenefitDeals(): Promise<MedBenefitDeal[] | null> {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      if (cached === '__down__') return null;
      return JSON.parse(cached) as MedBenefitDeal[];
    }
  } catch {
    // Cache-Fehler sind nicht kritisch — weiter zum Live-Fetch
  }

  const token = process.env.MOS_SERVICE_TOKEN;
  const baseUrl = process.env.MOS_BASE_URL;
  if (!token || !baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/mos/deals/active`, {
      headers: { 'x-mos-service-token': token },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      await writeNegative();
      return null;
    }
    const data = (await res.json()) as { deals?: MedBenefitDeal[] };
    const list = Array.isArray(data.deals) ? data.deals : [];
    await writeCache(list);
    return list;
  } catch {
    await writeNegative();
    return null;
  }
}

async function writeCache(deals: MedBenefitDeal[]): Promise<void> {
  try {
    await redis.set(CACHE_KEY, JSON.stringify(deals), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err }, 'medbenefit cache write failed');
  }
}

async function writeNegative(): Promise<void> {
  try {
    await redis.set(CACHE_KEY, '__down__', 'EX', NEGATIVE_TTL_SECONDS);
  } catch {
    // ignore
  }
}
