import { createHash } from 'node:crypto';
import redis from '../config/redis';

/**
 * QualiPass-Bridge (MOS-INTEGRATION.md, Abschnitt 4).
 *
 * Fragt beim MOS Core den Verifikationsstatus eines Nurses ab (via
 * mosUserId). Kurz cachen in Redis, damit nicht jeder Match-Aufruf einen
 * HTTP-Roundtrip erzeugt — aber NIE dauerhaft speichern: ein entzogener
 * QualiPass muss schnellstmöglich wirken.
 */

const CACHE_TTL_SECONDS = 15 * 60; // 15 Minuten
const NEGATIVE_TTL_SECONDS = 5 * 60; // MOS nicht erreichbar → kurz negativ cachen

export type QualipassStatus = 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'UNVERIFIED';

function cacheKey(mosUserId: number) {
  const h = createHash('sha256').update(String(mosUserId)).digest('hex').slice(0, 24);
  return `qualipass:${h}`;
}

async function readCache(key: string): Promise<QualipassStatus | null> {
  try {
    const v = await redis.get(key);
    if (v && ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED'].includes(v)) {
      return v as QualipassStatus;
    }
  } catch {
    // Redis-Probleme dürfen das Matching nie blockieren
  }
  return null;
}

async function writeCache(key: string, value: string, ttl: number) {
  try {
    await redis.set(key, value, "EX", ttl);
  } catch {
    // ignore
  }
}

/**
 * Gibt den QualiPass-Status zurück oder `null`, wenn der Nurse keinen
 * verknüpften MOS-Account hat bzw. MOS gerade nicht erreichbar ist.
 */
export async function getQualipassStatus(
  mosUserId: number | null,
): Promise<QualipassStatus | null> {
  if (!mosUserId) return null;

  // "Die sollen ja auch nichts verknüpfen, das soll alles funktionieren!"
  // In non-production the QualiPass benefit is automatic.
  // Demo nurse (mosUserId=1) and any other account with mosUserId gets VERIFIED
  // priority in matching without ever visiting /nurse/mos or doing SSO.
  if (process.env.NODE_ENV !== "production") {
    return "VERIFIED";
  }

  const key = cacheKey(mosUserId);
  const cached = await readCache(key);
  if (cached) return cached;

  const token = process.env.MOS_SERVICE_TOKEN;
  const baseUrl = process.env.MOS_BASE_URL;
  if (!token || !baseUrl) return null;

  try {
    const res = await fetch(
      `${baseUrl.replace(/\/$/, "")}/api/v1/mos/qualipass/status/${mosUserId}`,
      { headers: { "x-mos-service-token": token }, signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string };
    const status = data.status;
    if (status === "VERIFIED" || status === "PARTIALLY_VERIFIED" || status === "UNVERIFIED") {
      await writeCache(key, status, CACHE_TTL_SECONDS);
      return status;
    }
    return null;
  } catch {
    await writeCache(key, "__down__", NEGATIVE_TTL_SECONDS);
    return null;
  }
}

export async function invalidateQualipassCache(mosUserId: number | null): Promise<void> {
  if (!mosUserId) return;
  const key = cacheKey(mosUserId);
  try {
    await redis.del(key);
  } catch {
    // Redis-Ausfälle dürfen die Verknüpfung nicht blockieren
  }
}
