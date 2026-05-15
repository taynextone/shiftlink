import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { signMatchContract } from '../services/match.service';
import { findCandidatesForJobShift } from '../services/matching.service';

export async function signMatchContractController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const contract = await signMatchContract(req.body.matchContractId, req.auth);

  res.status(200).json({
    matchContract: contract,
  });
}

export async function findCandidatesController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const result = await findCandidatesForJobShift(req.auth, req.body.jobShiftId);

  res.status(200).json(result);
}
