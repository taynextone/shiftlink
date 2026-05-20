import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import {
  createJobShift,
  exportHospitalBillingData,
  getHospitalBillingSummary,
  importHospitalJobShift,
  listHospitalJobShifts,
} from '../services/job-shift.service';

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
