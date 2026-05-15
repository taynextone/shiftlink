import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  copyOwnAvailabilityBlockController,
  createOwnAvailabilityBlockController,
  deleteOwnAvailabilityBlockController,
  listOwnAvailabilityBlocksController,
  replaceOwnAvailabilityBlocksController,
  setAvailabilityBlockBookedStateController,
  updateOwnAvailabilityBlockController,
} from '../controllers/nurse-availability.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import {
  copyAvailabilityBlockSchema,
  createAvailabilityBlockSchema,
  replaceAvailabilityBlocksSchema,
  setAvailabilityBlockBookedSchema,
  updateAvailabilityBlockSchema,
} from '../schemas/nurse-availability.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get('/me', requireAuth, requireRole(UserRole.NURSE), asyncHandler(listOwnAvailabilityBlocksController));
router.post('/me', requireAuth, requireRole(UserRole.NURSE), validateBody(createAvailabilityBlockSchema), asyncHandler(createOwnAvailabilityBlockController));
router.patch('/me/:blockId', requireAuth, requireRole(UserRole.NURSE), validateBody(updateAvailabilityBlockSchema), asyncHandler(updateOwnAvailabilityBlockController));
router.delete('/me/:blockId', requireAuth, requireRole(UserRole.NURSE), asyncHandler(deleteOwnAvailabilityBlockController));
router.put('/me', requireAuth, requireRole(UserRole.NURSE), validateBody(replaceAvailabilityBlocksSchema), asyncHandler(replaceOwnAvailabilityBlocksController));
router.post('/me/copy', requireAuth, requireRole(UserRole.NURSE), validateBody(copyAvailabilityBlockSchema), asyncHandler(copyOwnAvailabilityBlockController));
router.patch('/:blockId/booked', requireAuth, requireRole(UserRole.SUPER_ADMIN), validateBody(setAvailabilityBlockBookedSchema), asyncHandler(setAvailabilityBlockBookedStateController));

export default router;
