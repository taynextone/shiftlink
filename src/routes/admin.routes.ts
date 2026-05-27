import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/async-handler';

import { requireAuth, requireRole } from '../middlewares/auth';
import { getAuditLogsController, getBusinessMetricsController, getPayrollExportController } from '../controllers/admin.controller';

export const router = Router();

router.get(
  '/admin/audit-logs',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(getAuditLogsController),
);

router.get(
  '/admin/metrics',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(getBusinessMetricsController),
);

router.get(
  '/admin/payroll-export',
  requireAuth,
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(getPayrollExportController),
);
