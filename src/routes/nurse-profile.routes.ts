import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { updateOwnNurseProfileController } from '../controllers/nurse-profile.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { updateNurseProfileSchema } from '../schemas/nurse-profile.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.patch(
  '/me',
  requireAuth,
  requireRole(UserRole.NURSE),
  validateBody(updateNurseProfileSchema),
  asyncHandler(updateOwnNurseProfileController),
);

export default router;
