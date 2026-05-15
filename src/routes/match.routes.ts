import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  createMatchOfferController,
  findCandidatesController,
  listOwnMatchContractsController,
  listVisibleJobShiftsController,
  respondToMatchOfferController,
  signMatchContractController,
} from '../controllers/match.controller';
import { validateBody } from '../middlewares/validate';
import {
  createMatchOfferSchema,
  findCandidatesSchema,
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
  '/me',
  requireAuth,
  requireRole(UserRole.NURSE),
  asyncHandler(listOwnMatchContractsController),
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
  '/candidates',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(findCandidatesSchema),
  asyncHandler(findCandidatesController),
);

export default router;
