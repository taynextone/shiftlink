import { mosSsoRateLimit } from "../middlewares/auth-rate-limit";
import { Router } from 'express';

import { asyncHandler } from '../utils/async-handler';
import { requireAuth } from '../middlewares/auth';
import { prisma } from '../config/prisma';
import createHttpError from 'http-errors';
import crypto from 'node:crypto';

/**
 * MOS-SSO Client (Stufe 3, MOS-INTEGRATION.md).
 *
 * Der Nutzer startet im ShiftLink „Mit MOS anmelden/verknüpfen". Wir leiten
 * ihn mit einem CSRF-state zu MOS /sso/authorize; MOS ruft uns zurück
 * (?code=...&state=...) und wir tauschen den Code serverseitig gegen die
 * MOS-Identität. Danach verknüpfen wir den Account wie bei /mos/connect —
 * aber ganz ohne dass der Nutzer seine MOS-Credentials in ShiftLink eingibt.
 */

const router = Router();

const pendingStates = new Map<string, { userId: string; expiresAt: number }>();

// Aufräumen abgelaufener States (10 Minuten Gültigkeit)
setInterval(() => {
  const now = Date.now();
  for (const [state, entry] of pendingStates) {
    if (entry.expiresAt < now) {
      pendingStates.delete(state);
    }
  }
}, 60 * 1000).unref();

function mosBaseUrl(): string | null {
  return process.env.MOS_BASE_URL ?? null;
}

function serviceToken(): string | null {
  return process.env.MOS_SERVICE_TOKEN ?? null;
}

/** Schritt 1: State ausstellen und zum MOS weiterleiten. */
router.get('/auth/mos/sso/start', requireAuth, (req, res) => {
  const baseUrl = mosBaseUrl();
  if (!baseUrl || !serviceToken()) {
    res.status(503).json({ message: 'MOS-SSO ist nicht konfiguriert' });
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  const userId = (req as unknown as { auth?: { userId: string } }).auth?.userId;
  if (!userId) {
    throw createHttpError(401, 'Nicht angemeldet');
  }
  pendingStates.set(state, { userId, expiresAt: Date.now() + 10 * 60 * 1000 });

  // Redirect-Ziel ist diese ShiftLink-Instanz selbst:
  const proto = req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http';
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost:3000';
  const redirect = `${proto}://${host}/api/v1/auth/mos/sso/callback`;

  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/sso/authorize?state=${encodeURIComponent(state)}&redirect=${encodeURIComponent(redirect)}`;
  res.redirect(url);
});

/** Schritt 2: Callback von MOS — Code gegen Identität tauschen + verknüpfen. */
router.get('/auth/mos/sso/callback', requireAuth, asyncHandler(async (req, res) => {
  const baseUrl = mosBaseUrl();
  const token = serviceToken();
  if (!baseUrl || !token) {
    throw createHttpError(503, 'MOS-SSO ist nicht konfiguriert');
  }

  const code = String(req.query.code ?? '');
  const state = String(req.query.state ?? '');
  const userId = (req as unknown as { auth?: { userId: string } }).auth?.userId;

  const pending = pendingStates.get(state);
  pendingStates.delete(state);

  if (!code || !userId || !pending || pending.userId !== userId || pending.expiresAt < Date.now()) {
    throw createHttpError(400, 'Ungültige oder abgelaufene SSO-Anfrage');
  }

  const tokenRes = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/sso/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-mos-service-token': token },
    body: JSON.stringify({ code, state }),
    signal: AbortSignal.timeout(5000),
  });

  if (!tokenRes.ok) {
    throw createHttpError(502, 'MOS hat den Code nicht akzeptiert');
  }

  const identity = (await tokenRes.json()) as { userId: number; verificationStatus?: string };

  // Doppel-Verknüpfungsschutz: gehört diese mosUserId schon einem anderen Nutzer?
  const clash = await prisma.user.findFirst({
    where: { mosUserId: identity.userId, NOT: { id: userId } },
  });
  if (clash) {
    throw createHttpError(409, 'Dieser MOS-Account ist bereits mit einem anderen ShiftLink-Konto verknüpft');
  }

  await prisma.user.update({ where: { id: userId }, data: { mosUserId: identity.userId } });

  // Zurück ins Nurse-Dashboard (UI zeigt dann den verbundenen Status)
  const proto = req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http';
  const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'localhost:3000';
  res.redirect(`${proto}://${host}/nurse/mos?connected=1`);
}));

export default router;

