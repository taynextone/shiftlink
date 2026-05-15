import { Request, Response } from 'express';
import { registerUser } from '../services/auth.service';
import { signAuthToken } from '../utils/jwt';
import { setAuthCookie, AUTH_COOKIE_NAME } from '../utils/cookies';

export async function registerController(req: Request, res: Response): Promise<void> {
  const user = await registerUser(req.body);
  const token = signAuthToken({
    sub: user.id,
    role: user.role,
  });

  setAuthCookie(res, token);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      nurseProfile: user.nurseProfile,
      hospitalProfile: user.hospitalProfile,
    },
  });
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
