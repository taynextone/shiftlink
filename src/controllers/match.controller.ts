import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import {
  createMatchOffer,
  listHospitalMatchOffers,
  listOwnMatchContracts,
  listVisibleJobShiftsForNurse,
  respondToMatchOffer,
  signMatchContract,
} from '../services/match.service';
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

export async function createMatchOfferController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContract = await createMatchOffer(req.auth, req.body);

  res.status(201).json({
    matchContract,
  });
}

export async function listVisibleJobShiftsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const jobShifts = await listVisibleJobShiftsForNurse(req.auth, req.query.limit ? Number(req.query.limit) : undefined);

  res.status(200).json({
    jobShifts,
  });
}

export async function listOwnMatchContractsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContracts = await listOwnMatchContracts(req.auth);

  res.status(200).json({
    matchContracts,
  });
}

export async function listHospitalMatchOffersController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const result = await listHospitalMatchOffers(req.auth, String(req.query.jobShiftId ?? ''));

  res.status(200).json(result);
}

export async function respondToMatchOfferController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const result = await respondToMatchOffer(req.auth, req.body);

  res.status(200).json(result);
}
