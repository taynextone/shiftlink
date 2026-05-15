import { Router } from 'express';
import { UserRole } from '@prisma/client';
import {
  copyOwnAvailabilityBlockController,
  createOwnAvailabilityBlockController,
  listOwnAvailabilityBlocksController,
  replaceOwnAvailabilityBlocksController,
} from '../controllers/nurse-availability.controller';
import { requireAuth, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validate';
import {
  copyAvailabilityBlockSchema,
  createAvailabilityBlockSchema,
  replaceAvailabilityBlocksSchema,
} from '../schemas/nurse-availability.schema';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.use(requireAuth, requireRole(UserRole.NURSE));
router.get('/me', asyncHandler(listOwnAvailabilityBlocksController));
router.post('/me', validateBody(createAvailabilityBlockSchema), asyncHandler(createOwnAvailabilityBlockController));
router.put('/me', validateBody(replaceAvailabilityBlocksSchema), asyncHandler(replaceOwnAvailabilityBlocksController));
router.post('/me/copy', validateBody(copyAvailabilityBlockSchema), asyncHandler(copyOwnAvailabilityBlockController));

export default router;
