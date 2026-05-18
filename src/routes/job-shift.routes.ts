import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  createJobShiftController,
  importHospitalJobShiftController,
  listHospitalJobShiftsController,
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
