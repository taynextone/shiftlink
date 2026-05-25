import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  createJobShiftController,
  exportHospitalBillingController,
  getHospitalBillingSummaryController,
  importHospitalJobShiftController,
  listHospitalJobShiftsController,
  listHospitalWebhookEventsController,
  listAsyncProcessFailuresController,
  retryWebhookEventController,
  resolveAsyncFailureController,
} from '../controllers/job-shift.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createJobShiftSchema, importJobShiftSchema } from '../schemas/job-shift.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(listHospitalJobShiftsController),
);

router.get(
  '/billing/summary',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getHospitalBillingSummaryController),
);

router.get(
  '/billing/export',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(exportHospitalBillingController),
);



router.get(
  '/async-failures',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(listAsyncProcessFailuresController),
);

router.post(
  '/webhooks/:id/retry',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN),
  asyncHandler(retryWebhookEventController),
);

router.post(
  '/async-failures/:id/resolve',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(resolveAsyncFailureController),
);

router.get(
  '/webhooks',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(listHospitalWebhookEventsController),
);

router.post(
  '/import',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(importJobShiftSchema),
  asyncHandler(importHospitalJobShiftController),
);

router.post(
  '/',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(createJobShiftSchema),
  asyncHandler(createJobShiftController),
);

export default router;
