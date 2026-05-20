import createHttpError from 'http-errors';
import { ContractExecutionStatus, ContractSignerRole, MatchContractStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';

function mapActorToSignerRole(role: UserRole): ContractSignerRole {
  if (role === UserRole.HOSPITAL_ADMIN) {
    return ContractSignerRole.HOSPITAL_ADMIN;
  }
  if (role === UserRole.NURSE) {
    return ContractSignerRole.NURSE;
  }
  return ContractSignerRole.SUPER_ADMIN;
}

function buildVoidEvidence(actor: { userId: string; role: UserRole }, reason: string) {
  return {
    actorUserId: actor.userId,
    actorRole: actor.role,
    reason,
    recordedAt: new Date().toISOString(),
    mechanism: 'authenticated-platform-void-intent',
  };
}

export async function voidContractExecution(
  matchContractId: string,
  actor: { userId: string; role: UserRole },
  reason: string,
) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
        },
      },
      signatureEvents: true,
      voidEvent: true,
      invoice: true,
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const isSuperAdmin = actor.role === UserRole.SUPER_ADMIN;
  const isHospitalOwner = actor.role === UserRole.HOSPITAL_ADMIN && contract.jobShift.hospitalProfile.userId === actor.userId;

  if (!isSuperAdmin && !isHospitalOwner) {
    throw createHttpError(403, 'You are not allowed to void this contract');
  }

  if (contract.voidEvent || contract.executionStatus === ContractExecutionStatus.VOIDED || contract.status === MatchContractStatus.CANCELED) {
    throw createHttpError(409, 'Contract was already voided or canceled');
  }

  if (contract.executionStatus === ContractExecutionStatus.FULLY_EXECUTED) {
    throw createHttpError(409, 'Fully executed contracts cannot be voided through this flow');
  }

  if (contract.invoice && contract.invoice.status === 'PAID') {
    throw createHttpError(409, 'Contracts with paid platform invoices cannot be voided through this flow');
  }

  const voidEvent = await prisma.contractVoidEvent.create({
    data: {
      matchContractId: contract.id,
      actorUserId: actor.userId,
      actorRole: mapActorToSignerRole(actor.role),
      reason,
      evidenceJson: JSON.stringify(buildVoidEvidence(actor, reason)),
    },
  });

  const updatedContract = await prisma.matchContract.update({
    where: { id: contract.id },
    data: {
      status: MatchContractStatus.CANCELED,
      executionStatus: ContractExecutionStatus.VOIDED,
    },
    include: {
      voidEvent: true,
    },
  });

  return {
    matchContractId: updatedContract.id,
    status: updatedContract.status,
    executionStatus: updatedContract.executionStatus,
    voidedAt: updatedContract.voidEvent?.createdAt ?? voidEvent.createdAt,
    reason: updatedContract.voidEvent?.reason ?? voidEvent.reason,
  };
}

export async function getContractVoidOverview(
  matchContractId: string,
  actor: { userId: string; role: UserRole },
) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
        },
      },
      voidEvent: true,
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const isSuperAdmin = actor.role === UserRole.SUPER_ADMIN;
  const isHospitalOwner = contract.jobShift.hospitalProfile.userId === actor.userId;
  const isNurseOwner = contract.nurseProfile.userId === actor.userId;

  if (!isSuperAdmin && !isHospitalOwner && !isNurseOwner) {
    throw createHttpError(403, 'You are not allowed to access this contract void overview');
  }

  return {
    matchContractId: contract.id,
    status: contract.status,
    executionStatus: contract.executionStatus,
    voidEvent: contract.voidEvent
      ? {
          actorUserId: contract.voidEvent.actorUserId,
          actorRole: contract.voidEvent.actorRole,
          reason: contract.voidEvent.reason,
          createdAt: contract.voidEvent.createdAt,
        }
      : null,
  };
}
