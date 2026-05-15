import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { createJobShift } from '../services/job-shift.service';

export async function createJobShiftController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const jobShift = await createJobShift(req.auth, req.body);

  res.status(201).json({
    jobShift,
  });
}
