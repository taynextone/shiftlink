import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';

export async function getContractLifecycleOverview(
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
      contractSnapshots: {
        orderBy: {
          version: 'asc',
        },
      },
      currentSnapshot: true,
      signatureEvents: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      voidEvent: true,
      invoice: true,
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const isSuperAdmin = actor.role === UserRole.SUPER_ADMIN;
  const isHospitalOwner = contract.jobShift.hospitalProfile.userId === actor.userId;
  const isNurseOwner = contract.nurseProfile.userId === actor.userId;

  if (!isSuperAdmin && !isHospitalOwner && !isNurseOwner) {
    throw createHttpError(403, 'You are not allowed to access this contract lifecycle overview');
  }

  return {
    matchContractId: contract.id,
    status: contract.status,
    executionStatus: contract.executionStatus,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
    expiresAt: contract.expiresAt,
    respondedAt: contract.respondedAt,
    signedAt: contract.signedAt,
    fullyExecutedAt: contract.fullyExecutedAt,
    hospital: {
      hospitalProfileId: contract.jobShift.hospitalProfile.id,
      clinicName: contract.jobShift.hospitalProfile.clinicName,
    },
    nurse: {
      nurseProfileId: contract.nurseProfile.id,
      publicId: contract.nurseProfile.publicId,
      displayName: contract.nurseProfile.displayName,
    },
    contractPdf: contract.contractPdfUrl
      ? {
          available: true,
          fileUrl: contract.contractPdfUrl,
        }
      : {
          available: false,
          fileUrl: null,
        },
    invoice: contract.invoice
      ? {
          id: contract.invoice.id,
          status: contract.invoice.status,
          amount: contract.invoice.amount,
          invoicePdfUrl: contract.invoice.invoicePdfUrl,
        }
      : null,
    snapshotSummary: {
      currentSnapshotId: contract.currentSnapshot?.id ?? null,
      currentSnapshotVersion: contract.currentSnapshot?.version ?? null,
      totalSnapshots: contract.contractSnapshots.length,
      versions: contract.contractSnapshots.map((snapshot) => ({
        id: snapshot.id,
        version: snapshot.version,
        createdAt: snapshot.createdAt,
        summaryText: snapshot.summaryText,
      })),
    },
    signatureSummary: {
      totalSignatures: contract.signatureEvents.length,
      events: contract.signatureEvents.map((event) => ({
        id: event.id,
        signerUserId: event.signerUserId,
        signerRole: event.signerRole,
        signatureIntent: event.signatureIntent,
        snapshotId: event.snapshotId,
        createdAt: event.createdAt,
      })),
    },
    voidSummary: contract.voidEvent
      ? {
          id: contract.voidEvent.id,
          actorUserId: contract.voidEvent.actorUserId,
          actorRole: contract.voidEvent.actorRole,
          reason: contract.voidEvent.reason,
          createdAt: contract.voidEvent.createdAt,
        }
      : null,
  };
}
