import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { registerUser, loginUser } from '../services/auth.service';
import { signAuthToken } from '../utils/jwt';
import { setAuthCookie, clearAuthCookie, AUTH_COOKIE_NAME } from '../utils/cookies';
import { env } from '../config/env';

const prisma = new PrismaClient();

const DEMO_NURSE_EMAIL = 'demo.nurse@shiftlink.dev';
const DEMO_HOSPITAL_EMAIL = 'demo.hospital@shiftlink.dev';
const DEMO_PASSWORD = 'DemoShiftlink2026!';

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

export async function demoLoginController(req: Request, res: Response): Promise<void> {
  if (env.NODE_ENV === 'production') {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const { role } = req.body as { role?: string };

  if (role !== 'NURSE' && role !== 'HOSPITAL_ADMIN') {
    res.status(400).json({ message: 'Invalid demo role. Use NURSE or HOSPITAL_ADMIN.' });
    return;
  }

  type DemoUser = {
    id: string;
    email: string;
    role: string;
    verificationStatus: string;
    nurseProfile: unknown;
    hospitalProfile: unknown;
  };

  async function fetchUserWithProfiles(where: { email: string }): Promise<DemoUser> {
    const u = await prisma.user.findUniqueOrThrow({
      where,
      include: { nurseProfile: true, hospitalProfile: true },
    });
    return {
      id: u.id,
      email: u.email,
      role: u.role as string,
      verificationStatus: u.verificationStatus as string,
      nurseProfile: u.nurseProfile,
      hospitalProfile: u.hospitalProfile,
    };
  }

  async function ensureAndGet(
    email: string,
    createRole: UserRole,
    profile: Record<string, unknown>,
  ): Promise<DemoUser> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return fetchUserWithProfiles({ email });
    }
    await registerUser({
      email,
      password: DEMO_PASSWORD,
      role: createRole,
      ...(createRole === UserRole.NURSE
        ? { nurseProfile: profile }
        : { hospitalProfile: profile }),
    } as any);
    return fetchUserWithProfiles({ email });
  }

  let user: DemoUser;

  if (role === 'HOSPITAL_ADMIN') {
    user = await ensureAndGet(DEMO_HOSPITAL_EMAIL, UserRole.HOSPITAL_ADMIN, {
      clinicName: 'Demo Krankenhaus',
      billingAddress: 'Musterstraße 1, 10115 Berlin',
      taxNumber: 'DE123456789',
    });
  } else {
    user = await ensureAndGet(DEMO_NURSE_EMAIL, UserRole.NURSE, {
      displayName: 'Demo Nurse',
      firstName: 'Anna',
      lastName: 'Schmidt',
      iban: 'DE89370400440532013000',
      minHourlyRate: 45,
      phoneNumber: '+491701234567',
      whatsappOptIn: true,
    });
  }

  const token = signAuthToken({ sub: user.id, role: user.role as UserRole });
  setAuthCookie(res, token);
  res.status(200).json(buildAuthResponse(user));
}
