import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { getAuditLogs, type AuditAction } from '../services/audit.service';

export async function getAuditLogsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  if (req.auth.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only super admins can view audit logs');
  }

  const action = typeof req.query.action === 'string' ? req.query.action as AuditAction : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;

  const result = await getAuditLogs({ action, limit });

  res.status(200).json(result);
}
