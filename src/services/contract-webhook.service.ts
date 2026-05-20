import { MatchContractStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createHospitalWebhookEvent } from './webhook.service';

async function getContractWebhookContext(matchContractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
        },
      },
      currentSnapshot: true,
      voidEvent: true,
    },
  });

  if (!contract) {
    throw new Error(`Match contract ${matchContractId} not found for webhook event emission`);
  }

  return contract;
}

export async function emitContractPdfGeneratedEvent(matchContractId: string) {
  const contract = await getContractWebhookContext(matchContractId);

  if (!contract.contractPdfUrl) {
    return null;
  }

  return createHospitalWebhookEvent({
    hospitalProfileId: contract.jobShift.hospitalProfile.id,
    eventType: 'contract.pdf.generated',
    payload: {
      matchContractId: contract.id,
      jobShiftId: contract.jobShift.id,
      nurseProfileId: contract.nurseProfile.id,
      status: contract.status,
      executionStatus: contract.executionStatus,
      snapshotId: contract.currentSnapshot?.id ?? null,
      snapshotVersion: contract.currentSnapshot?.version ?? null,
      contractPdfUrl: contract.contractPdfUrl,
    },
  });
}

export async function emitContractExecutionSignedEvent(matchContractId: string, actor: { userId: string; role: UserRole }) {
  const contract = await getContractWebhookContext(matchContractId);

  return createHospitalWebhookEvent({
    hospitalProfileId: contract.jobShift.hospitalProfile.id,
    eventType: 'contract.execution.signed',
    payload: {
      matchContractId: contract.id,
      jobShiftId: contract.jobShift.id,
      nurseProfileId: contract.nurseProfile.id,
      status: contract.status,
      executionStatus: contract.executionStatus,
      signerUserId: actor.userId,
      signerRole: actor.role,
      snapshotId: contract.currentSnapshot?.id ?? null,
      snapshotVersion: contract.currentSnapshot?.version ?? null,
    },
  });
}

export async function emitContractFullyExecutedEvent(matchContractId: string) {
  const contract = await getContractWebhookContext(matchContractId);

  return createHospitalWebhookEvent({
    hospitalProfileId: contract.jobShift.hospitalProfile.id,
    eventType: 'contract.execution.fully-executed',
    payload: {
      matchContractId: contract.id,
      jobShiftId: contract.jobShift.id,
      nurseProfileId: contract.nurseProfile.id,
      status: contract.status,
      executionStatus: contract.executionStatus,
      fullyExecutedAt: contract.fullyExecutedAt,
      snapshotId: contract.currentSnapshot?.id ?? null,
      snapshotVersion: contract.currentSnapshot?.version ?? null,
    },
  });
}

export async function emitContractVoidedEvent(matchContractId: string) {
  const contract = await getContractWebhookContext(matchContractId);

  return createHospitalWebhookEvent({
    hospitalProfileId: contract.jobShift.hospitalProfile.id,
    eventType: 'contract.voided',
    payload: {
      matchContractId: contract.id,
      jobShiftId: contract.jobShift.id,
      nurseProfileId: contract.nurseProfile.id,
      status: contract.status,
      executionStatus: contract.executionStatus,
      voidedAt: contract.voidEvent?.createdAt ?? null,
      voidReason: contract.voidEvent?.reason ?? null,
      snapshotId: contract.currentSnapshot?.id ?? null,
      snapshotVersion: contract.currentSnapshot?.version ?? null,
    },
  });
}

export async function emitMatchOfferSignedEvent(matchContractId: string) {
  const contract = await getContractWebhookContext(matchContractId);

  if (contract.status !== MatchContractStatus.SIGNED) {
    return null;
  }

  return createHospitalWebhookEvent({
    hospitalProfileId: contract.jobShift.hospitalProfile.id,
    eventType: 'match.offer.signed',
    payload: {
      matchContractId: contract.id,
      jobShiftId: contract.jobShift.id,
      nurseProfileId: contract.nurseProfile.id,
      status: contract.status,
      executionStatus: contract.executionStatus,
      signedAt: contract.signedAt,
      snapshotId: contract.currentSnapshot?.id ?? null,
      snapshotVersion: contract.currentSnapshot?.version ?? null,
    },
  });
}
