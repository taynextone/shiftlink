import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  getOwnVerificationOverviewController,
  getPublicNurseProfileController,
  reviewVerificationDocumentController,
  updateOwnNurseProfileController,
} from '../controllers/nurse-profile.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { reviewVerificationDocumentSchema, updateNurseProfileSchema } from '../schemas/nurse-profile.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/public/:publicId', asyncHandler(getPublicNurseProfileController));
router.get(
  '/me/verification',
  requireAuth,
  requireRole(UserRole.NURSE),
  asyncHandler(getOwnVerificationOverviewController),
);
router.patch(
  '/me',
  requireAuth,
  requireRole(UserRole.NURSE),
  validateBody(updateNurseProfileSchema),
  asyncHandler(updateOwnNurseProfileController),
);
router.post(
  '/verification/review',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  validateBody(reviewVerificationDocumentSchema),
  asyncHandler(reviewVerificationDocumentController),
);

export default router;
