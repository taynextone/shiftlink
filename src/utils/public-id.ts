import crypto from 'crypto';

export function generateNursePublicId(): string {
  return `NUR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}
