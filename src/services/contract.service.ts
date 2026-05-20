import createHttpError from 'http-errors';
import { MatchContractStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';

function buildContractSummary(snapshot: Record<string, any>): string {
  return [
    `Pflegekraft: ${snapshot.nurse.displayName}`,
    `Einrichtung: ${snapshot.hospital.clinicName}`,
    `Einsatz: ${snapshot.jobShift.title ?? 'Pflegeeinsatz'}`,
    `Ort: ${snapshot.jobShift.locationCity ?? 'unbekannt'}`,
    `Zeitraum: ${snapshot.jobShift.startTime} bis ${snapshot.jobShift.endTime}`,
    `Vereinbarter Stundenlohn: ${snapshot.nurse.minHourlyRate}`,
    `Plattformgebühr pro Stunde: ${snapshot.platform.platformFeePerHour}`,
  ].join(' | ');
}

export async function createContractSnapshot(matchContractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      nurseProfile: {
        include: {
          specializations: true,
        },
      },
      jobShift: {
        include: {
          hospitalProfile: true,
          requirements: true,
        },
      },
      contractSnapshots: {
        orderBy: {
          version: 'desc',
        },
        take: 1,
      },
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const nextVersion = (contract.contractSnapshots[0]?.version ?? 0) + 1;

  const snapshot = {
    matchContractId: contract.id,
    version: nextVersion,
    contractStatus: contract.status,
    createdAt: new Date().toISOString(),
    platform: {
      role: 'vermittlung-und-matching-plattform',
      isEmployer: false,
      isStaffingAgency: false,
      handlesPayroll: false,
      platformFeePerHour: '3.00',
    },
    hospital: {
      hospitalProfileId: contract.jobShift.hospitalProfile.id,
      clinicName: contract.jobShift.hospitalProfile.clinicName,
      billingAddress: contract.jobShift.hospitalProfile.billingAddress,
      taxNumber: contract.jobShift.hospitalProfile.taxNumber,
    },
    nurse: {
      nurseProfileId: contract.nurseProfile.id,
      publicId: contract.nurseProfile.publicId,
      displayName: contract.nurseProfile.displayName,
      firstName: contract.nurseProfile.firstName,
      lastName: contract.nurseProfile.lastName,
      minHourlyRate: contract.nurseProfile.minHourlyRate.toString(),
      specializations: contract.nurseProfile.specializations.map((item) => item.tag),
    },
    jobShift: {
      jobShiftId: contract.jobShift.id,
      externalJobShiftId: contract.jobShift.externalJobShiftId,
      title: contract.jobShift.title,
      department: contract.jobShift.department,
      stationName: contract.jobShift.stationName,
      locationCity: contract.jobShift.locationCity,
      startTime: contract.jobShift.startTime.toISOString(),
      endTime: contract.jobShift.endTime.toISOString(),
      totalPlannedHours: contract.jobShift.totalPlannedHours.toString(),
      requirements: contract.jobShift.requirements.map((item) => ({ tag: item.tag, priority: item.priority })),
    },
    commercialTerms: {
      invoiceTrigger: 'digital-signature',
      noRefundPolicy: true,
      hospitalPaysNurseDirectly: true,
      platformIssuesServiceFeeInvoiceOnly: true,
    },
  };

  const created = await prisma.contractSnapshot.create({
    data: {
      matchContractId: contract.id,
      version: nextVersion,
      snapshotJson: JSON.stringify(snapshot),
      summaryText: buildContractSummary(snapshot),
    },
  });

  await prisma.matchContract.update({
    where: { id: contract.id },
    data: {
      currentSnapshotId: created.id,
    },
  });

  return created;
}

export async function getContractSnapshot(
  matchContractId: string,
  actor: { userId: string; role: UserRole },
) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      currentSnapshot: true,
      nurseProfile: true,
      jobShift: {
        include: {
          hospitalProfile: true,
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
    throw createHttpError(403, 'You are not allowed to access this contract snapshot');
  }

  if (!contract.currentSnapshot) {
    throw createHttpError(404, 'No contract snapshot available yet');
  }

  return {
    id: contract.currentSnapshot.id,
    version: contract.currentSnapshot.version,
    summaryText: contract.currentSnapshot.summaryText,
    snapshot: JSON.parse(contract.currentSnapshot.snapshotJson),
  };
}

export async function ensureContractSnapshotForOffer(matchContractId: string) {
  const existing = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      currentSnapshot: true,
    },
  });

  if (!existing) {
    throw createHttpError(404, 'Match contract not found');
  }

  if (existing.currentSnapshot) {
    return existing.currentSnapshot;
  }

  return createContractSnapshot(matchContractId);
}
