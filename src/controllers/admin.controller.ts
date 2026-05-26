import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { getAuditLogs, type AuditAction } from '../services/audit.service';
import { getBusinessMetrics } from '../services/metrics.service';
import { getPayrollExport } from '../services/payroll-export.service';

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

export async function getPayrollExportController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  if (req.auth.role !== UserRole.HOSPITAL_ADMIN && req.auth.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can export payroll data');
  }

  const hospitalProfile = await prisma.hospitalProfile.findUnique({
    where: { userId: req.auth.userId },
  });

  if (!hospitalProfile) {
    throw createHttpError(404, 'Hospital profile not found');
  }

  const result = await getPayrollExport(hospitalProfile.id);
  res.status(200).json(result);
}

export async function getBusinessMetricsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  if (req.auth.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only super admins can view business metrics');
  }

  const metrics = await getBusinessMetrics();
  res.status(200).json(metrics);
}
