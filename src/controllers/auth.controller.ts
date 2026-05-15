import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';
import { signAuthToken } from '../utils/jwt';
import { setAuthCookie, clearAuthCookie, AUTH_COOKIE_NAME } from '../utils/cookies';

function buildAuthResponse(user: {
  id: string;
  email: string;
  role: string;
  verificationStatus: string;
  nurseProfile: unknown;
  hospitalProfile: unknown;
}) {
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      nurseProfile: user.nurseProfile,
      hospitalProfile: user.hospitalProfile,
    },
  };
}

export async function registerController(req: Request, res: Response): Promise<void> {
  const user = await registerUser(req.body);
  const token = signAuthToken({
    sub: user.id,
    role: user.role,
  });

  setAuthCookie(res, token);
  res.status(201).json(buildAuthResponse(user));
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const user = await loginUser(req.body.email, req.body.password);
  const token = signAuthToken({
    sub: user.id,
    role: user.role,
  });

  setAuthCookie(res, token);
  res.status(200).json(buildAuthResponse(user));
}

export async function logoutController(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
}

export async function meController(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    auth: {
      userId: req.auth?.userId,
      role: req.auth?.role,
      cookieName: AUTH_COOKIE_NAME,
    },
  });
}
