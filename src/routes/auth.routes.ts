import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { registerController, loginController, logoutController, meController, demoLoginController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/async-handler';
import { authRateLimit } from '../middlewares/auth-rate-limit';
import { requireAuth, requireRole } from '../middlewares/auth';

const router = Router();

router.use(authRateLimit);
router.post('/register', validateBody(registerSchema), asyncHandler(registerController));
router.post('/login', validateBody(loginSchema), asyncHandler(loginController));
router.post('/demo-login', asyncHandler(demoLoginController));
router.post('/logout', requireAuth, asyncHandler(logoutController));
router.get('/me', requireAuth, requireRole(UserRole.NURSE, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN), asyncHandler(meController));

export default router;
