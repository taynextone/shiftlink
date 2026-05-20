import createHttpError from 'http-errors';
import { InvoiceStatus, JobShiftStatus, MatchContractStatus, Prisma, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  BillingExportQueryInput,
  CreateJobShiftInput,
  ImportJobShiftInput,
  ListJobShiftsQueryInput,
} from '../schemas/job-shift.schema';
import { createHospitalWebhookEvent } from './webhook.service';

async function requireHospitalProfile(actor: { userId: string; role: UserRole }) {
  const hospitalProfile = await prisma.hospitalProfile.findUnique({
    where: { userId: actor.userId },
  });

  if (!hospitalProfile && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(404, 'Hospital profile not found');
  }

  const hospitalProfileId = hospitalProfile?.id;

  if (!hospitalProfileId || !hospitalProfile) {
    throw createHttpError(400, 'Super admin job shift access requires a mapped hospital profile');
  }

  return hospitalProfile;
}

function buildCreateData(hospitalProfileId: string, input: CreateJobShiftInput | ImportJobShiftInput): Prisma.JobShiftCreateInput {
  return {
    hospitalProfile: {
      connect: {
        id: hospitalProfileId,
      },
    },
    externalJobShiftId: input.externalJobShiftId,
    title: input.title,
    department: input.department,
    stationName: input.stationName,
    locationCity: input.locationCity,
    locationPostalCode: input.locationPostalCode,
    locationLatitude: input.locationLatitude !== undefined ? new Prisma.Decimal(input.locationLatitude) : undefined,
    locationLongitude: input.locationLongitude !== undefined ? new Prisma.Decimal(input.locationLongitude) : undefined,
    startTime: new Date(input.startTime),
    endTime: new Date(input.endTime),
    totalPlannedHours: new Prisma.Decimal(input.totalPlannedHours),
    requirements: {
      create: input.requirements.map((requirement) => ({
        tag: requirement.tag,
        priority: requirement.priority,
      })),
    },
  };
}

function buildUpdateData(input: ImportJobShiftInput): Prisma.JobShiftUpdateInput {
  return {
    title: input.title,
    department: input.department,
    stationName: input.stationName,
    locationCity: input.locationCity,
    locationPostalCode: input.locationPostalCode,
    locationLatitude: input.locationLatitude !== undefined ? new Prisma.Decimal(input.locationLatitude) : null,
    locationLongitude: input.locationLongitude !== undefined ? new Prisma.Decimal(input.locationLongitude) : null,
    startTime: new Date(input.startTime),
    endTime: new Date(input.endTime),
    totalPlannedHours: new Prisma.Decimal(input.totalPlannedHours),
    requirements: {
      deleteMany: {},
      create: input.requirements.map((requirement) => ({
        tag: requirement.tag,
        priority: requirement.priority,
      })),
    },
  };
}

function hasLockedOfferState(matchContracts: Array<{ status: MatchContractStatus }>) {
  return matchContracts.some((contract) => contract.status === MatchContractStatus.SIGNED);
}

function hasOpenOfferState(matchContracts: Array<{ status: MatchContractStatus }>) {
  return matchContracts.some((contract) => contract.status === MatchContractStatus.PENDING);
}

function toOfferCounts(matchContracts: Array<{ status: MatchContractStatus; invoice?: unknown | null }>) {
  return matchContracts.reduce(
    (acc, contract) => {
      acc.total += 1;
      if (contract.status === 'PENDING') acc.pending += 1;
      if (contract.status === 'DECLINED') acc.declined += 1;
      if (contract.status === 'SIGNED') acc.signed += 1;
      if (contract.status === 'EXPIRED') acc.expired += 1;
      if (contract.status === 'CANCELED') acc.canceled += 1;
      if (contract.invoice) acc.invoiced += 1;
      return acc;
    },
    { total: 0, pending: 0, declined: 0, signed: 0, expired: 0, canceled: 0, invoiced: 0 },
  );
}

function csvEscape(value: unknown): string {
  const stringValue = value == null ? '' : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function createJobShift(actor: { userId: string; role: UserRole }, input: CreateJobShiftInput) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can create job shifts');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const jobShift = await prisma.jobShift.create({
    data: buildCreateData(hospitalProfile.id, input),
    include: {
      requirements: true,
    },
  });

  await createHospitalWebhookEvent({
    hospitalProfileId: hospitalProfile.id,
    eventType: 'shift.created',
    payload: {
      jobShiftId: jobShift.id,
      externalJobShiftId: jobShift.externalJobShiftId,
      status: jobShift.status,
    },
  });

  return jobShift;
}

export async function importHospitalJobShift(actor: { userId: string; role: UserRole }, input: ImportJobShiftInput) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can import job shifts');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const existing = await prisma.jobShift.findUnique({
    where: {
      hospitalProfileId_externalJobShiftId: {
        hospitalProfileId: hospitalProfile.id,
        externalJobShiftId: input.externalJobShiftId,
      },
    },
    include: {
      requirements: true,
      matchContracts: true,
    },
  });

  if (!existing) {
    const jobShift = await prisma.jobShift.create({
      data: buildCreateData(hospitalProfile.id, input),
      include: {
        requirements: true,
      },
    });

    await createHospitalWebhookEvent({
      hospitalProfileId: hospitalProfile.id,
      eventType: 'shift.imported',
      payload: {
        jobShiftId: jobShift.id,
        externalJobShiftId: jobShift.externalJobShiftId,
        status: jobShift.status,
        mode: 'created',
      },
    });

    return {
      mode: 'created' as const,
      jobShift,
    };
  }

  if (existing.status !== JobShiftStatus.OPEN) {
    throw createHttpError(409, 'Only open job shifts can be updated through import');
  }

  if (hasLockedOfferState(existing.matchContracts)) {
    throw createHttpError(409, 'Imported shift cannot be changed after a signed match exists');
  }

  if (hasOpenOfferState(existing.matchContracts)) {
    throw createHttpError(409, 'Imported shift cannot be changed while pending offers exist');
  }

  const updated = await prisma.jobShift.update({
    where: { id: existing.id },
    data: buildUpdateData(input),
    include: {
      requirements: true,
    },
  });

  await createHospitalWebhookEvent({
    hospitalProfileId: hospitalProfile.id,
    eventType: 'shift.imported',
    payload: {
      jobShiftId: updated.id,
      externalJobShiftId: updated.externalJobShiftId,
      status: updated.status,
      mode: 'updated',
    },
  });

  return {
    mode: 'updated' as const,
    jobShift: updated,
  };
}

export async function listHospitalJobShifts(
  actor: { userId: string; role: UserRole },
  query: ListJobShiftsQueryInput = {},
) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can view job shifts');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const where: Prisma.JobShiftWhereInput = {
    hospitalProfileId: hospitalProfile.id,
    status: query.status as JobShiftStatus | undefined,
  };

  const jobShifts = await prisma.jobShift.findMany({
    where,
    include: {
      requirements: true,
      matchContracts: {
        include: {
          invoice: true,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
    take: query.limit ?? 50,
  });

  return {
    jobShifts: jobShifts.map((jobShift) => ({
      id: jobShift.id,
      externalJobShiftId: jobShift.externalJobShiftId,
      title: jobShift.title,
      department: jobShift.department,
      stationName: jobShift.stationName,
      locationCity: jobShift.locationCity,
      startTime: jobShift.startTime,
      endTime: jobShift.endTime,
      status: jobShift.status,
      totalPlannedHours: jobShift.totalPlannedHours,
      requirements: jobShift.requirements,
      offerCounts: toOfferCounts(jobShift.matchContracts),
    })),
  };
}

export async function getHospitalBillingSummary(actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can view billing summary');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const matchContracts = await prisma.matchContract.findMany({
    where: {
      jobShift: {
        hospitalProfileId: hospitalProfile.id,
      },
    },
    include: {
      invoice: true,
      jobShift: true,
    },
  });

  const summary = matchContracts.reduce(
    (acc, contract) => {
      if (contract.status === MatchContractStatus.SIGNED) {
        acc.signedContracts += 1;
      }
      if (contract.invoice) {
        acc.invoiceCount += 1;
        const amount = Number(contract.invoice.amount);
        acc.totalInvoiceAmount += amount;
        if (contract.invoice.status === InvoiceStatus.PAID) {
          acc.paidInvoiceAmount += amount;
        } else {
          acc.pendingInvoiceAmount += amount;
        }
      }
      return acc;
    },
    {
      signedContracts: 0,
      invoiceCount: 0,
      totalInvoiceAmount: 0,
      pendingInvoiceAmount: 0,
      paidInvoiceAmount: 0,
    },
  );

  return summary;
}

export async function exportHospitalBillingData(
  actor: { userId: string; role: UserRole },
  query: BillingExportQueryInput = {},
) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can export billing data');
  }

  const hospitalProfile = await requireHospitalProfile(actor);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: query.status as InvoiceStatus | undefined,
      matchContract: {
        jobShift: {
          hospitalProfileId: hospitalProfile.id,
        },
      },
    },
    include: {
      matchContract: {
        include: {
          nurseProfile: true,
          jobShift: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: query.limit ?? 200,
  });

  const rows = invoices.map((invoice) => ({
    invoiceId: invoice.id,
    invoiceStatus: invoice.status,
    invoiceAmount: invoice.amount.toString(),
    createdAt: invoice.createdAt.toISOString(),
    matchContractId: invoice.matchContract.id,
    matchStatus: invoice.matchContract.status,
    externalJobShiftId: invoice.matchContract.jobShift.externalJobShiftId ?? '',
    jobShiftId: invoice.matchContract.jobShift.id,
    jobShiftTitle: invoice.matchContract.jobShift.title ?? '',
    locationCity: invoice.matchContract.jobShift.locationCity ?? '',
    nursePublicId: invoice.matchContract.nurseProfile.publicId,
    nurseDisplayName: invoice.matchContract.nurseProfile.displayName,
    signedAt: invoice.matchContract.signedAt?.toISOString() ?? '',
  }));

  if (query.format === 'csv') {
    const headers = [
      'invoiceId',
      'invoiceStatus',
      'invoiceAmount',
      'createdAt',
      'matchContractId',
      'matchStatus',
      'externalJobShiftId',
      'jobShiftId',
      'jobShiftTitle',
      'locationCity',
      'nursePublicId',
      'nurseDisplayName',
      'signedAt',
    ];
    const lines = [headers.join(',')].concat(
      rows.map((row) => headers.map((header) => csvEscape(row[header as keyof typeof row])).join(',')),
    );

    return {
      format: 'csv' as const,
      contentType: 'text/csv; charset=utf-8',
      body: lines.join('\n'),
    };
  }

  return {
    format: 'json' as const,
    rows,
  };
}
