import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import {
  createMatchOffer,
  listHospitalMatchOffers,
  listOwnMatchContracts,
  listVisibleJobShiftsForNurse,
  reopenMatchOffer,
  respondToMatchOffer,
  signMatchContract,
} from '../services/match.service';
import { getContractSnapshot } from '../services/contract.service';
import { getContractPdfDownload } from '../services/contract-pdf.service';
import { getContractExecutionOverview, signContractExecution } from '../services/contract-signature.service';
import { getContractVoidOverview, voidContractExecution } from '../services/contract-void.service';
import { getContractLifecycleOverview } from '../services/contract-audit.service';
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

export async function reopenMatchOfferController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContract = await reopenMatchOffer(req.auth, req.body);

  res.status(200).json({ matchContract });
}

export async function getContractSnapshotController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContractId = req.params.id;

  if (typeof matchContractId !== 'string' || matchContractId.length === 0) {
    throw createHttpError(400, 'Invalid match contract id');
  }

  const contractSnapshot = await getContractSnapshot(matchContractId, req.auth);

  res.status(200).json({
    contractSnapshot,
  });
}

export async function getContractPdfController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContractId = req.params.id;

  if (typeof matchContractId !== 'string' || matchContractId.length === 0) {
    throw createHttpError(400, 'Invalid match contract id');
  }

  const contractPdf = await getContractPdfDownload(matchContractId, req.auth);

  res.status(200).json({
    contractPdf,
  });
}

export async function signContractExecutionController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContractId = req.params.id;

  if (typeof matchContractId !== 'string' || matchContractId.length === 0) {
    throw createHttpError(400, 'Invalid match contract id');
  }

  const execution = await signContractExecution(matchContractId, req.auth);

  res.status(200).json({ execution });
}

export async function getContractExecutionOverviewController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContractId = req.params.id;

  if (typeof matchContractId !== 'string' || matchContractId.length === 0) {
    throw createHttpError(400, 'Invalid match contract id');
  }

  const execution = await getContractExecutionOverview(matchContractId, req.auth);

  res.status(200).json({ execution });
}

export async function voidContractExecutionController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContractId = req.params.id;
  const reason = req.body?.reason;

  if (typeof matchContractId !== 'string' || matchContractId.length === 0) {
    throw createHttpError(400, 'Invalid match contract id');
  }

  if (typeof reason !== 'string' || reason.trim().length < 10) {
    throw createHttpError(400, 'A meaningful void reason is required');
  }

  const result = await voidContractExecution(matchContractId, req.auth, reason.trim());

  res.status(200).json({ voiding: result });
}

export async function getContractVoidOverviewController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContractId = req.params.id;

  if (typeof matchContractId !== 'string' || matchContractId.length === 0) {
    throw createHttpError(400, 'Invalid match contract id');
  }

  const voiding = await getContractVoidOverview(matchContractId, req.auth);

  res.status(200).json({ voiding });
}

export async function getContractLifecycleOverviewController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const matchContractId = req.params.id;

  if (typeof matchContractId !== 'string' || matchContractId.length === 0) {
    throw createHttpError(400, 'Invalid match contract id');
  }

  const lifecycle = await getContractLifecycleOverview(matchContractId, req.auth);

  res.status(200).json({ lifecycle });
}
