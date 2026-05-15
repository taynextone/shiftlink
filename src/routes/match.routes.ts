import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { signMatchContractController } from '../controllers/match.controller';
import { validateBody } from '../middlewares/validate';
import { signMatchContractSchema } from '../schemas/match.schema';
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

export default router;
