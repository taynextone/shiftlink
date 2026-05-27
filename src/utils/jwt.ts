import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export type UserRole = 'NURSE' | 'HOSPITAL_ADMIN' | 'SUPER_ADMIN';

export type AuthTokenPayload = {
  sub: string;
  role: UserRole;
};

export function signAuthToken(payload: AuthTokenPayload): string {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
}
