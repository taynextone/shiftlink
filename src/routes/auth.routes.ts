import { Router } from 'express';
import { registerController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';
import { registerSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/async-handler';
import { authRateLimit } from '../middlewares/auth-rate-limit';

const router = Router();

router.use(authRateLimit);
router.post('/register', validateBody(registerSchema), asyncHandler(registerController));

export default router;
