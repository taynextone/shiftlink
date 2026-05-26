import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';

import { requireAuth } from '../middlewares/auth';
import { getAuditLogsController } from '../controllers/admin.controller';

export const router = Router();

router.get(
  '/admin/audit-logs',
  requireAuth,
  asyncHandler(getAuditLogsController),
);
