import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  createMatchOfferController,
  extendOfferExpiryController,
  findCandidatesController,
  getContractExecutionOverviewController,
  getContractLifecycleOverviewController,
  getContractPdfController,
  getContractSnapshotController,
  getContractVoidOverviewController,
  signContractExecutionController,
  voidContractExecutionController,
  listHospitalMatchOffersController,
  listOwnMatchContractsController,
  listVisibleJobShiftsController,
  reopenMatchOfferController,
  respondToMatchOfferController,
  retryMatchOfferWhatsappController,
  signMatchContractController,
} from '../controllers/match.controller';
import { validateBody } from '../middlewares/validate';
import {
  createMatchOfferSchema,
  extendOfferExpirySchema,
  findCandidatesSchema,
  reopenMatchOfferSchema,
  respondToMatchOfferSchema,
  signMatchContractSchema,
} from '../schemas/match.schema';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.get(
  '/visible-job-shifts',
  requireAuth,
  requireRole(UserRole.NURSE),
  asyncHandler(listVisibleJobShiftsController),
);

router.get(
  '/contract/:id',
  requireAuth,
  asyncHandler(getContractSnapshotController),
);

router.get(
  '/contract/:id/pdf',
  requireAuth,
  asyncHandler(getContractPdfController),
);

router.get(
  '/contract/:id/lifecycle',
  requireAuth,
  asyncHandler(getContractLifecycleOverviewController),
);

router.get(
  '/contract/:id/execution',
  requireAuth,
  asyncHandler(getContractExecutionOverviewController),
);

router.post(
  '/contract/:id/execution/sign',
  requireAuth,
  asyncHandler(signContractExecutionController),
);

router.get(
  '/contract/:id/void',
  requireAuth,
  asyncHandler(getContractVoidOverviewController),
);

router.post(
  '/contract/:id/void',
  requireAuth,
  asyncHandler(voidContractExecutionController),
);

router.get(
  '/me',
  requireAuth,
  requireRole(UserRole.NURSE),
  asyncHandler(listOwnMatchContractsController),
);

router.get(
  '/hospital-offers',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(listHospitalMatchOffersController),
);

router.post(
  '/respond',
  requireAuth,
  requireRole(UserRole.NURSE),
  validateBody(respondToMatchOfferSchema),
  asyncHandler(respondToMatchOfferController),
);

router.post(
  '/offer',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(createMatchOfferSchema),
  asyncHandler(createMatchOfferController),
);

router.post(
  '/sign',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(signMatchContractSchema),
  asyncHandler(signMatchContractController),
);

router.post(
  '/extend-offer',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(extendOfferExpirySchema),
  asyncHandler(extendOfferExpiryController),
);

router.post(
  '/reopen',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(reopenMatchOfferSchema),
  asyncHandler(reopenMatchOfferController),
);

router.post(
  '/retry-whatsapp',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(reopenMatchOfferSchema),
  asyncHandler(retryMatchOfferWhatsappController),
);

router.post(
  '/candidates',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(findCandidatesSchema),
  asyncHandler(findCandidatesController),
);

export default router;
