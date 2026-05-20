import createHttpError from 'http-errors';
import { ContractExecutionStatus, ContractSignerRole, MatchContractStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createContractSnapshot } from './contract.service';
import { generateContractPdfArtifact } from './contract-pdf.service';

function buildSignatureEvidence(actor: { userId: string; role: UserRole }) {
  return {
    signerUserId: actor.userId,
    signerRole: actor.role,
    recordedAt: new Date().toISOString(),
    mechanism: 'authenticated-platform-signature-intent',
  };
}

function mapActorToSignerRole(role: UserRole): ContractSignerRole {
  if (role === UserRole.HOSPITAL_ADMIN) {
    return ContractSignerRole.HOSPITAL_ADMIN;
  }

  if (role === UserRole.NURSE) {
    return ContractSignerRole.NURSE;
  }

  return ContractSignerRole.SUPER_ADMIN;
}

export async function signContractExecution(
  matchContractId: string,
  actor: { userId: string; role: UserRole },
) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      nurseProfile: {
        include: {
          user: true,
        },
      },
      jobShift: {
        include: {
          hospitalProfile: true,
        },
      },
      currentSnapshot: true,
      signatureEvents: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  if (contract.status !== MatchContractStatus.SIGNED) {
    throw createHttpError(409, 'Contract must be signed before execution signatures can be recorded');
  }

  const isSuperAdmin = actor.role === UserRole.SUPER_ADMIN;
  const isHospitalSigner = actor.role === UserRole.HOSPITAL_ADMIN && contract.jobShift.hospitalProfile.userId === actor.userId;
  const isNurseSigner = actor.role === UserRole.NURSE && contract.nurseProfile.userId === actor.userId;

  if (!isSuperAdmin && !isHospitalSigner && !isNurseSigner) {
    throw createHttpError(403, 'You are not allowed to sign this contract execution');
  }

  const existingRoleSignature = contract.signatureEvents.find((event) => event.signerUserId === actor.userId);
  if (existingRoleSignature) {
    throw createHttpError(409, 'This signer already recorded a signature for the current contract execution');
  }

  const activeSnapshot = contract.currentSnapshot ?? (await createContractSnapshot(contract.id));

  const signatureEvent = await prisma.contractSignatureEvent.create({
    data: {
      matchContractId: contract.id,
      signerUserId: actor.userId,
      signerRole: mapActorToSignerRole(actor.role),
      snapshotId: activeSnapshot.id,
      signatureIntent: 'EXECUTE_CONTRACT',
      signatureEvidenceJson: JSON.stringify(buildSignatureEvidence(actor)),
    },
  });

  const allSignatures = [...contract.signatureEvents, signatureEvent];
  const hasHospitalSignature = allSignatures.some((event) => event.signerRole === ContractSignerRole.HOSPITAL_ADMIN || event.signerRole === ContractSignerRole.SUPER_ADMIN);
  const hasNurseSignature = allSignatures.some((event) => event.signerRole === ContractSignerRole.NURSE || event.signerRole === ContractSignerRole.SUPER_ADMIN);

  let nextExecutionStatus: ContractExecutionStatus = ContractExecutionStatus.DRAFT;
  let fullyExecutedAt: Date | null = null;

  if (hasHospitalSignature && hasNurseSignature) {
    nextExecutionStatus = ContractExecutionStatus.FULLY_EXECUTED;
    fullyExecutedAt = new Date();
  } else if (hasHospitalSignature) {
    nextExecutionStatus = ContractExecutionStatus.PENDING_NURSE_SIGNATURE;
  } else if (hasNurseSignature) {
    nextExecutionStatus = ContractExecutionStatus.PENDING_HOSPITAL_SIGNATURE;
  }

  const updatedContract = await prisma.matchContract.update({
    where: { id: contract.id },
    data: {
      executionStatus: nextExecutionStatus,
      fullyExecutedAt,
    },
    include: {
      signatureEvents: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (nextExecutionStatus === ContractExecutionStatus.FULLY_EXECUTED) {
    await generateContractPdfArtifact(contract.id);
  }

  return {
    executionStatus: updatedContract.executionStatus,
    fullyExecutedAt: updatedContract.fullyExecutedAt,
    signatureEvent: {
      id: signatureEvent.id,
      signerRole: signatureEvent.signerRole,
      createdAt: signatureEvent.createdAt,
    },
    signatureCount: updatedContract.signatureEvents.length,
  };
}

export async function getContractExecutionOverview(
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
      signatureEvents: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const isSuperAdmin = actor.role === UserRole.SUPER_ADMIN;
  const isHospitalOwner = contract.jobShift.hospitalProfile.userId === actor.userId;
  const isNurseOwner = contract.nurseProfile.userId === actor.userId;

  if (!isSuperAdmin && !isHospitalOwner && !isNurseOwner) {
    throw createHttpError(403, 'You are not allowed to access this contract execution overview');
  }

  return {
    matchContractId: contract.id,
    executionStatus: contract.executionStatus,
    fullyExecutedAt: contract.fullyExecutedAt,
    signatureEvents: contract.signatureEvents.map((event) => ({
      id: event.id,
      signerUserId: event.signerUserId,
      signerRole: event.signerRole,
      signatureIntent: event.signatureIntent,
      createdAt: event.createdAt,
    })),
  };
}
