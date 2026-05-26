import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';

import { requireAuth } from '../middlewares/auth';
import { getAuditLogsController, getBusinessMetricsController, getPayrollExportController } from '../controllers/admin.controller';

export const router = Router();

router.get(
  '/admin/audit-logs',
  requireAuth,
  asyncHandler(getAuditLogsController),
);

router.get(
  '/admin/metrics',
  requireAuth,
  asyncHandler(getBusinessMetricsController),
);

router.get(
  '/admin/payroll-export',
  requireAuth,
  asyncHandler(getPayrollExportController),
);
