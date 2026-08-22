import { Router } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

/**
 * QualiPass Signal API — MOS ecosystem integration endpoint.
 *
 * Lets MOS/QualiPass query a nurse's verification status so the sibling
 * products can gate their own features on it ("dein QualiPass ist die
 * Eintrittskarte"). Authenticated via shared service token (MOS_SERVICE_TOKEN)
 * instead of user JWT because MOS calls this server-to-server.
 *
 * Response shape is intentionally minimal and stable — treat it as a contract:
 *   { publicId, displayName, verificationStatus, isReleasedForMatching, documents: [...] }
 */

export const mosSignalRoutes = Router();

function requireServiceToken(req: import('express').Request) {
  const provided = req.header('x-mos-service-token');
  if (!env.MOS_SERVICE_TOKEN || provided !== env.MOS_SERVICE_TOKEN) {
    return false;
  }
  return true;
}

mosSignalRoutes.get('/qualipass/status/:publicId', async (req, res) => {
  if (!requireServiceToken(req)) {
    res.status(401).json({ error: 'Invalid or missing service token' });
    return;
  }

  const profile = await prisma.nurseProfile.findUnique({
    where: { publicId: String(req.params.publicId) },
    include: {
      verificationDocuments: {
        select: { documentType: true, status: true, reviewedAt: true },
      },
    },
  });

  if (!profile) {
    res.status(404).json({ error: 'Nurse profile not found' });
    return;
  }

  res.status(200).json({
    publicId: profile.publicId,
    displayName: profile.displayName,
    verificationStatus: profile.isReleasedForMatching ? 'VERIFIED' : 'PENDING',
    isReleasedForMatching: profile.isReleasedForMatching,
    releasedAt: profile.releasedAt,
    documents: profile.verificationDocuments.map((doc) => ({
      documentType: doc.documentType,
      status: doc.status,
      reviewedAt: doc.reviewedAt,
    })),
  });
});
