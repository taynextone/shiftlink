import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/async-handler';
import { getActiveMedBenefitDeals } from '../services/medbenefit.service';

/**
 * MedBenefit-Deals für die Pflegekraft-Vitrine (Stufe A).
 * Öffentliche Deal-Liste aus MOS-Core (gecacht) — keine personenbezogenen Daten.
 */
const router = Router();

router.get(
  '/deals',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const deals = await getActiveMedBenefitDeals();
    res.status(200).json({ deals: deals ?? [], available: deals !== null });
  }),
);

export default router;
