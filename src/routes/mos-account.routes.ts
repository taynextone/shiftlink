import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { requireAuth } from '../middlewares/auth';
import { getQualipassStatus, invalidateQualipassCache } from '../services/qualipass.service';
import { recordAuditLog } from '../services/audit.service';

/**
 * MOS-Account-Verknüpfung (Stufe 2, siehe docs/MOS-INTEGRATION.md).
 *
 * Der Nutzer gibt E-Mail + Passwort seines MOS-Accounts einmalig an.
 * Wir verifizieren sie beim MOS Core (service-to-service) und speichern
 * NUR die mosUserId — niemals das Passwort.
 */
const router = Router();

const connectSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

async function verifyWithMos(email: string, password: string) {
  const token = process.env.MOS_SERVICE_TOKEN;
  const baseUrl = process.env.MOS_BASE_URL;
  if (!token || !baseUrl) {
    throw Object.assign(new Error('MOS integration not configured'), { status: 503 });
  }
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/auth/verify-credentials`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-mos-service-token': token },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    throw Object.assign(new Error('MOS request failed'), { status: 502 });
  }
  return (await res.json()) as {
    userId: number;
    email: string | null;
    verificationStatus: string;
  };
}

/** Aktuelle Verknüpfung abfragen. */
router.get('/mos/status', requireAuth, async (req, res) => {
  const userId = (req as unknown as { auth?: { userId: string } }).auth?.userId;
  if (!userId) return res.status(401).json({ message: 'Nicht angemeldet' });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mosUserId: true },
  });
  const qp = user?.mosUserId ? await getQualipassStatus(user.mosUserId) : null;
  res.json({ connected: !!user?.mosUserId, mosUserId: user?.mosUserId ?? null, qualipassStatus: qp });
});

/** MOS-Account verbinden. */
router.post('/mos/connect', requireAuth, async (req, res) => {
  const userId = (req as unknown as { auth?: { userId: string } }).auth?.userId;
  if (!userId) return res.status(401).json({ message: 'Nicht angemeldet' });

  const parsed = connectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'E-Mail und Passwort erforderlich' });
  }

  try {
    const mosUser = await verifyWithMos(parsed.data.email, parsed.data.password);
    if (!mosUser) {
      return res.status(401).json({ message: 'MOS-Zugangsdaten sind nicht korrekt' });
    }

    // Verhindern, dass ein MOS-Account an zwei ShiftLink-Accounts hängt
    const clash = await prisma.user.findFirst({
      where: { mosUserId: mosUser.userId, NOT: { id: userId } },
      select: { id: true },
    });
    if (clash) {
      return res
        .status(409)
        .json({ message: 'Dieser MOS-Account ist bereits mit einem anderen ShiftLink-Konto verbunden' });
    }

    await prisma.user.update({ where: { id: userId }, data: { mosUserId: mosUser.userId } });

    await invalidateQualipassCache(mosUser.userId);

    await recordAuditLog({
      action: 'MOS_CONNECT',
      actorUserId: userId,
      actorRole: (req as unknown as { auth?: { role?: string } }).auth?.role ?? 'UNKNOWN',
      targetEntityType: 'USER',
      targetEntityId: userId,
      metadata: { method: 'manual', mosUserId: mosUser.userId },
    });

    return res.json({
      connected: true,
      mosUserId: mosUser.userId,
      qualipassStatus: mosUser.verificationStatus,
      message:
        mosUser.verificationStatus === 'VERIFIED'
          ? 'Dein QualiPass ist vollständig verifiziert — dein Profil wird für Matching freigegeben.'
          : mosUser.verificationStatus === 'PARTIALLY_VERIFIED'
            ? 'Dein QualiPass ist teilweise verifiziert. Ergänze fehlende Nachweise in MOS.'
            : 'Verbindung steht. Dein QualiPass ist noch nicht verifiziert — lade Nachweise bei MOS (QualiSafe) hoch.',
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    if (status >= 500) console.error('[mos-connect]', err);
    return res.status(status).json({ message: (err as Error).message || 'Fehler bei der MOS-Verbindung' });
  }
});

/** Verknüpfung trennen. */
router.post('/mos/disconnect', requireAuth, async (req, res) => {
  const userId = (req as unknown as { auth?: { userId: string } }).auth?.userId;
  if (!userId) return res.status(401).json({ message: 'Nicht angemeldet' });
  const prev = await prisma.user.findUnique({ where: { id: userId }, select: { mosUserId: true } });
  await prisma.user.update({ where: { id: userId }, data: { mosUserId: null } });
  if (prev?.mosUserId) await invalidateQualipassCache(prev.mosUserId);
  await recordAuditLog({
    action: 'MOS_DISCONNECT',
    actorUserId: userId,
    actorRole: (req as unknown as { auth?: { role?: string } }).auth?.role ?? 'UNKNOWN',
    targetEntityType: 'USER',
    targetEntityId: userId,
    metadata: { method: 'manual', previousMosUserId: prev?.mosUserId ?? null },
  });
  res.json({ connected: false });
});

export default router;
