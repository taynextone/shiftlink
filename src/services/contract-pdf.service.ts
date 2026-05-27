import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createSignedDownloadUrl, uploadPrivateTextFile } from './storage.service';

type ContractSnapshotPayload = {
  matchContractId: string;
  version: number;
  platform: {
    role: string;
    isEmployer: boolean;
    isStaffingAgency: boolean;
    handlesPayroll: boolean;
    platformFeePerHour: string;
  };
  hospital: {
    clinicName: string;
    billingAddress: string | null;
    taxNumber: string | null;
  };
  nurse: {
    displayName: string;
    firstName: string | null;
    lastName: string | null;
    minHourlyRate: string;
    specializations: string[];
  };
  jobShift: {
    title: string | null;
    department: string | null;
    stationName: string | null;
    locationCity: string | null;
    startTime: string;
    endTime: string;
    totalPlannedHours: string;
  };
  commercialTerms: {
    invoiceTrigger: string;
    noRefundPolicy: boolean;
    hospitalPaysNurseDirectly: boolean;
    platformIssuesServiceFeeInvoiceOnly: boolean;
  };
};

function renderContractArtifact(snapshot: ContractSnapshotPayload, signatureImages?: { hospital?: string; nurse?: string }): string {
  return [
    'SHIFTLINK CONTRACT ARTIFACT',
    `Contract: ${snapshot.matchContractId}`,
    `Version: ${snapshot.version}`,
    '',
    'Platform role',
    `- Role: ${snapshot.platform.role}`,
    `- Employer: ${snapshot.platform.isEmployer ? 'yes' : 'no'}`,
    `- Staffing agency: ${snapshot.platform.isStaffingAgency ? 'yes' : 'no'}`,
    `- Payroll handled by platform: ${snapshot.platform.handlesPayroll ? 'yes' : 'no'}`,
    `- Platform fee per hour: ${snapshot.platform.platformFeePerHour}`,
    '',
    'Hospital',
    `- Clinic: ${snapshot.hospital.clinicName}`,
    `- Billing address: ${snapshot.hospital.billingAddress ?? 'n/a'}`,
    `- Tax number: ${snapshot.hospital.taxNumber ?? 'n/a'}`,
    '',
    'Nurse',
    `- Display name: ${snapshot.nurse.displayName}`,
    `- Name: ${snapshot.nurse.firstName ?? ''} ${snapshot.nurse.lastName ?? ''}`.trim(),
    `- Hourly rate: ${snapshot.nurse.minHourlyRate}`,
    `- Specializations: ${snapshot.nurse.specializations.join(', ') || 'n/a'}`,
    '',
    'Assignment',
    `- Title: ${snapshot.jobShift.title ?? 'Pflegeeinsatz'}`,
    `- Department: ${snapshot.jobShift.department ?? 'n/a'}`,
    `- Station: ${snapshot.jobShift.stationName ?? 'n/a'}`,
    `- City: ${snapshot.jobShift.locationCity ?? 'n/a'}`,
    `- Start: ${snapshot.jobShift.startTime}`,
    `- End: ${snapshot.jobShift.endTime}`,
    `- Planned hours: ${snapshot.jobShift.totalPlannedHours}`,
    '',
    'Commercial terms',
    `- Invoice trigger: ${snapshot.commercialTerms.invoiceTrigger}`,
    `- Hospital pays nurse directly: ${snapshot.commercialTerms.hospitalPaysNurseDirectly ? 'yes' : 'no'}`,
    `- Platform issues service fee invoice only: ${snapshot.commercialTerms.platformIssuesServiceFeeInvoiceOnly ? 'yes' : 'no'}`,
    `- No refund policy: ${snapshot.commercialTerms.noRefundPolicy ? 'yes' : 'no'}`,
    '',
    'eSignature (EES)',
    signatureImages?.hospital ? `- Klinik: Unterschrift vorhanden` : '- Klinik: Nicht signiert',
    signatureImages?.nurse ? `- Pflegekraft: Unterschrift vorhanden` : '- Pflegekraft: Nicht signiert',
  ].join('\n');
}

export async function generateContractPdfArtifact(matchContractId: string, providedSnapshot?: { id: string; version: number; snapshotJson: string }) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      currentSnapshot: true,
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Match contract not found');
  }

  const activeSnapshot = providedSnapshot ?? contract.currentSnapshot;

  if (!activeSnapshot) {
    throw createHttpError(409, 'No contract snapshot available yet');
  }

  const snapshot = JSON.parse(activeSnapshot.snapshotJson) as ContractSnapshotPayload;

  // Load signature images (best-effort, don't fail PDF generation if signatures unavailable)
  let signatureImages: { hospital?: string; nurse?: string } = {};
  try {
    const signatureEvents = await prisma.contractSignatureEvent.findMany({
      where: { matchContractId },
    });
    for (const evt of signatureEvents) {
      const evidence = JSON.parse(evt.signatureEvidenceJson) as { signatureImage?: string };
      if (evidence.signatureImage) {
        if (evt.signerRole === 'HOSPITAL_ADMIN') signatureImages.hospital = evidence.signatureImage;
        if (evt.signerRole === 'NURSE') signatureImages.nurse = evidence.signatureImage;
      }
    }
  } catch {
    // Signature images are optional for PDF generation
  }

  const objectKey = `contracts/${matchContractId}/v${activeSnapshot.version}.pdf`;
  const artifactBody = renderContractArtifact(snapshot, signatureImages);
  const upload = await uploadPrivateTextFile({
    objectKey,
    body: artifactBody,
    contentType: 'application/pdf',
  });

  await prisma.matchContract.update({
    where: { id: matchContractId },
    data: {
      contractPdfUrl: upload.fileUrl,
    },
  });

  return {
    fileUrl: upload.fileUrl,
    objectKey: upload.objectKey,
    version: activeSnapshot.version,
  };
}

export async function getContractPdfDownload(matchContractId: string, actor: { userId: string; role: UserRole }) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
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
    throw createHttpError(403, 'You are not allowed to access this contract PDF');
  }

  if (!contract.contractPdfUrl) {
    throw createHttpError(404, 'No contract PDF available yet');
  }

  return createSignedDownloadUrl(contract.contractPdfUrl);
}
