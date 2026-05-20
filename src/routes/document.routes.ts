import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { getExamenDocumentController, getHospitalNurseDossierController } from '../controllers/document.controller';
import { asyncHandler } from '../utils/async-handler';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.get(
  '/examen/:id',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getExamenDocumentController),
);

router.get(
  '/dossier/:id',
  requireAuth,
  requireRole(UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN),
  asyncHandler(getHospitalNurseDossierController),
);

export default router;
