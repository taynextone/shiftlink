import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import {
  createJobShift,
  exportHospitalBillingData,
  getHospitalBillingSummary,
  importHospitalJobShift,
  listHospitalJobShifts,
} from '../services/job-shift.service';
import { listHospitalWebhookEvents } from '../services/webhook.service';
import { listAsyncProcessFailures } from '../services/async-process.service';

export async function createJobShiftController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const jobShift = await createJobShift(req.auth, req.body);

  res.status(201).json({
    jobShift,
  });
}

export async function importHospitalJobShiftController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const result = await importHospitalJobShift(req.auth, req.body);

  res.status(result.mode === 'created' ? 201 : 200).json(result);
}

export async function listHospitalJobShiftsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const result = await listHospitalJobShifts(req.auth, {
    status: typeof req.query.status === 'string' ? (req.query.status as 'OPEN' | 'MATCHED' | 'CANCELED') : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  res.status(200).json(result);
}

export async function getHospitalBillingSummaryController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const summary = await getHospitalBillingSummary(req.auth);

  res.status(200).json({ summary });
}

export async function exportHospitalBillingController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const result = await exportHospitalBillingData(req.auth, {
    status: typeof req.query.status === 'string' ? (req.query.status as 'PENDING' | 'PAID') : undefined,
    format: typeof req.query.format === 'string' ? (req.query.format as 'json' | 'csv') : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  if (result.format === 'csv') {
    res.setHeader('content-type', result.contentType);
    res.status(200).send(result.body);
    return;
  }

  res.status(200).json(result);
}


export async function listHospitalWebhookEventsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const result = await listHospitalWebhookEvents(req.auth, {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  res.status(200).json(result);
}



export async function listAsyncProcessFailuresController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  if (req.auth.role !== 'SUPER_ADMIN') {
    throw createHttpError(403, 'Only super admins can access async process failures');
  }

  const result = await listAsyncProcessFailures(req.query.limit ? Number(req.query.limit) : undefined);

  res.status(200).json(result);
}

