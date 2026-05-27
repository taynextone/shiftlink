import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  completeOnboardingController,
  getHospitalDashboardSummaryController,
  getNurseDashboardSummaryController,
  getOwnVerificationOverviewController,
  getPublicNurseProfileController,
  getSuperadminVerificationOverviewByPublicIdController,
  reviewVerificationDocumentController,
  setMatchingReleaseByPublicIdController,
  updateOwnNurseProfileController,
  uploadDocumentController,
} from '../controllers/nurse-profile.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { reviewVerificationDocumentSchema, setMatchingReleaseSchema, updateNurseProfileSchema, uploadDocumentSchema } from '../schemas/nurse-profile.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/public/:publicId', asyncHandler(getPublicNurseProfileController));
router.get(
  '/me/hospital-dashboard',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN),
  asyncHandler(getHospitalDashboardSummaryController),
);
router.get(
  '/me/dashboard',
  requireAuth,
  requireRole(UserRole.NURSE),
  asyncHandler(getNurseDashboardSummaryController),
);
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
  '/me/onboarding',
  requireAuth,
  requireRole(UserRole.NURSE),
  validateBody(updateNurseProfileSchema),
  asyncHandler(completeOnboardingController),
);

router.post(
  '/me/documents',
  requireAuth,
  requireRole(UserRole.NURSE),
  validateBody(uploadDocumentSchema),
  asyncHandler(uploadDocumentController),
);
router.get(
  '/verification/admin/:publicId',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(getSuperadminVerificationOverviewByPublicIdController),
);


router.post(
  '/verification/release',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  validateBody(setMatchingReleaseSchema),
  asyncHandler(setMatchingReleaseByPublicIdController),
);

router.post(
  '/verification/review',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  validateBody(reviewVerificationDocumentSchema),
  asyncHandler(reviewVerificationDocumentController),
);

export default router;
