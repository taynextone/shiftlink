import { Request, Response } from 'express';
import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  createJobShift,
  exportHospitalBillingData,
  getHospitalBillingSummary,
  importHospitalJobShift,
  listHospitalJobShifts,
} from '../services/job-shift.service';
import { getInvoiceDetail, markInvoicePaid } from '../services/billing.service';
import { listHospitalWebhookEvents, retryWebhookEvent, updateHospitalWebhookConfig } from '../services/webhook.service';
import { getHospitalDossierOverview } from '../services/dossier.service';
import { signContract } from '../services/esignature.service';
import { getHospitalWhatsAppEvents, getWhatsAppEventsForContract } from '../services/whatsapp.service';
import { listAsyncProcessFailures, resolveAsyncFailure } from '../services/async-process.service';
import { reportNoShow, cancelByHospital, completeContract } from '../services/contract-lifecycle.service';

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

export async function retryWebhookEventController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) {
    throw createHttpError(400, 'Webhook event ID is required');
  }

  const result = await retryWebhookEvent(id);
  res.status(200).json(result);
}

export async function resolveAsyncFailureController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  if (req.auth.role !== 'SUPER_ADMIN') {
    throw createHttpError(403, 'Only super admins can resolve async process failures');
  }

  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) {
    throw createHttpError(400, 'Async failure ID is required');
  }

  const result = await resolveAsyncFailure(id);
  res.status(200).json(result);
}

export async function updateWebhookConfigController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  if (req.auth.role !== UserRole.HOSPITAL_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can update webhook config');
  }

  const result = await updateHospitalWebhookConfig(req.auth, req.body);
  res.status(200).json(result);
}

export async function getDossierOverviewController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }

  const isSuperAdmin = req.auth.role === UserRole.SUPER_ADMIN;
  const isHospitalAdmin = req.auth.role === UserRole.HOSPITAL_ADMIN;
  if (!isSuperAdmin && !isHospitalAdmin) {
    throw createHttpError(403, 'Access denied');
  }

  let hospitalProfileId: string | undefined;
  if (isHospitalAdmin) {
    const hospitalProfile = await prisma.hospitalProfile.findUnique({
      where: { userId: req.auth.userId },
    });
    hospitalProfileId = hospitalProfile?.id;
  } else {
    hospitalProfileId = typeof req.query.hospitalProfileId === 'string' ? req.query.hospitalProfileId : undefined;
  }

  if (!hospitalProfileId) {
    throw createHttpError(400, 'Hospital profile ID is required');
  }

  const result = await getHospitalDossierOverview(hospitalProfileId);
  res.status(200).json(result);
}

export async function getInvoiceDetailController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) throw createHttpError(400, 'Invoice ID is required');
  const result = await getInvoiceDetail(id);
  res.status(200).json(result);
}

export async function markInvoicePaidController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) throw createHttpError(400, 'Invoice ID is required');
  const result = await markInvoicePaid(id);
  res.status(200).json({ id: result.id, status: result.status });
}

export async function getHospitalWhatsAppEventsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }
  if (req.auth.role !== UserRole.HOSPITAL_ADMIN && req.auth.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can view notification events');
  }
  const hospitalProfile = await prisma.hospitalProfile.findUnique({
    where: { userId: req.auth.userId },
  });
  if (!hospitalProfile) {
    throw createHttpError(404, 'Hospital profile not found');
  }
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
  const events = await getHospitalWhatsAppEvents(hospitalProfile.id, { status, limit });
  res.status(200).json({ events });
}

export async function reportNoShowController(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw createHttpError(401, 'Auth required');
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) throw createHttpError(400, 'Contract ID is required');
  const result = await reportNoShow(id, req.auth);
  res.status(200).json(result);
}

export async function cancelByHospitalController(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw createHttpError(401, 'Auth required');
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) throw createHttpError(400, 'Contract ID is required');
  const result = await cancelByHospital(id, req.body.reason);
  res.status(200).json(result);
}

export async function completeContractController(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw createHttpError(401, 'Auth required');
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) throw createHttpError(400, 'Contract ID is required');
  const result = await completeContract(id);
  res.status(200).json(result);
}

export async function signContractController(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw createHttpError(401, 'Authentication required');
  const id = typeof req.params.id === 'string' ? req.params.id : '';
  if (!id) throw createHttpError(400, 'Contract ID is required');
  const party = req.body.party as 'HOSPITAL' | 'NURSE';
  if (!party || (party !== 'HOSPITAL' && party !== 'NURSE')) {
    throw createHttpError(400, 'Party must be HOSPITAL or NURSE');
  }
  const consentText = typeof req.body.consentText === 'string' ? req.body.consentText : '';
  const result = await signContract(id, party, req.auth, consentText);
  res.status(200).json(result);
}

export async function getWhatsAppEventsController(req: Request, res: Response): Promise<void> {
  if (!req.auth) {
    throw createHttpError(401, 'Authentication required');
  }
  const contractId = typeof req.params.contractId === 'string' ? req.params.contractId : '';
  if (!contractId) throw createHttpError(400, 'Contract ID is required');
  const events = await getWhatsAppEventsForContract(contractId);
  res.status(200).json({ events });
}

