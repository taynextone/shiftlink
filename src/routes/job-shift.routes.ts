import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  createJobShiftController,
  exportHospitalBillingController,
  getHospitalBillingSummaryController,
  getInvoiceDetailController,
  importHospitalJobShiftController,
  listHospitalJobShiftsController,
  listHospitalWebhookEventsController,
  listAsyncProcessFailuresController,
  markInvoicePaidController,
  retryWebhookEventController,
  resolveAsyncFailureController,
  getHospitalWhatsAppEventsController,
  getWhatsAppEventsController,
  updateWebhookConfigController,
  getDossierOverviewController,
  reportNoShowController,
  cancelByHospitalController,
  completeContractController,
  signContractController,
  getHybridSignatureStatusController,
  updatePaperContractStatusController,
  importActualsController,
} from '../controllers/job-shift.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createJobShiftSchema, importJobShiftSchema, updateWebhookConfigSchema } from '../schemas/job-shift.schema';
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
  '/billing/invoices/:id',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getInvoiceDetailController),
);

router.post(
  '/billing/invoices/:id/mark-paid',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(markInvoicePaidController),
);

router.get(
  '/whatsapp/events',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getHospitalWhatsAppEventsController),
);

router.patch(
  '/webhook-config',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN),
  validateBody(updateWebhookConfigSchema),
  asyncHandler(updateWebhookConfigController),
);

router.get(
  '/dossier-overview',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getDossierOverviewController),
);

router.get(
  '/whatsapp/:contractId/events',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getWhatsAppEventsController),
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

router.post('/contract/:id/no-show', requireAuth, requireRole(UserRole.HOSPITAL_ADMIN), asyncHandler(reportNoShowController));
router.post('/contract/:id/cancel', requireAuth, requireRole(UserRole.HOSPITAL_ADMIN), asyncHandler(cancelByHospitalController));
router.post('/contract/:id/complete', requireAuth, requireRole(UserRole.HOSPITAL_ADMIN), asyncHandler(completeContractController));

router.post(
  '/contract/:id/sign',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.NURSE),
  asyncHandler(signContractController),
);

router.post(
  '/import-actuals',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN),
  asyncHandler(importActualsController),
);

// Hybrid paper contract routes
router.get(
  '/contract/:id/hybrid-status',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.NURSE),
  asyncHandler(getHybridSignatureStatusController),
);
router.post(
  '/contract/:id/paper-sign',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN),
  asyncHandler(updatePaperContractStatusController),
);

export default router;
