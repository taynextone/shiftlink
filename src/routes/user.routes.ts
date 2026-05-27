import { Router } from 'express';
import { deleteOwnAccountController, exportOwnDataController } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.delete('/', requireAuth, asyncHandler(deleteOwnAccountController));
router.get('/export', requireAuth, asyncHandler(exportOwnDataController));

export default router;
