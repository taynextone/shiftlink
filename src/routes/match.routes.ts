import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { findCandidatesController, signMatchContractController } from '../controllers/match.controller';
import { validateBody } from '../middlewares/validate';
import { findCandidatesSchema, signMatchContractSchema } from '../schemas/match.schema';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.post(
  '/sign',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(signMatchContractSchema),
  asyncHandler(signMatchContractController),
);

router.post(
  '/candidates',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(findCandidatesSchema),
  asyncHandler(findCandidatesController),
);

export default router;
