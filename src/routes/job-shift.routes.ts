import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { createJobShiftController, listHospitalJobShiftsController } from '../controllers/job-shift.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import { createJobShiftSchema } from '../schemas/job-shift.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get(
  '/',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(listHospitalJobShiftsController),
);

router.post(
  '/',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  validateBody(createJobShiftSchema),
  asyncHandler(createJobShiftController),
);

export default router;
