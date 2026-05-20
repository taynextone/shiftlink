import createHttpError from 'http-errors';
import { UserRole, VerificationDocumentStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createSignedDownloadUrl } from './storage.service';

async function getAuthorizedNurseProfileForHospitalAccess(nurseProfileId: string, actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can access nurse dossier data');
  }

  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { id: nurseProfileId },
    include: {
      verificationDocuments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      specializations: true,
      matchContracts: {
        where: {
          status: 'SIGNED',
        },
        include: {
          jobShift: {
            include: {
              hospitalProfile: true,
            },
          },
        },
      },
    },
  });

  if (!nurseProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  const hasAccess =
    actor.role === UserRole.SUPER_ADMIN ||
    nurseProfile.matchContracts.some((contract) => contract.jobShift.hospitalProfile.userId === actor.userId);

  if (!hasAccess) {
    throw createHttpError(403, 'You are not allowed to access this nurse dossier');
  }

  return nurseProfile;
}

export async function getAccessibleExamenDocument(nurseProfileId: string, actor: { userId: string; role: UserRole }) {
  const nurseProfile = await getAuthorizedNurseProfileForHospitalAccess(nurseProfileId, actor);

  if (!nurseProfile.examenFileUrl) {
    throw createHttpError(404, 'No examen document available for this nurse');
  }

  const signedDownload = await createSignedDownloadUrl(nurseProfile.examenFileUrl);

  return {
    nurseProfileId: nurseProfile.id,
    objectKey: signedDownload.objectKey,
    signedUrl: signedDownload.url,
    expiresIn: signedDownload.expiresIn,
  };
}

export async function getHospitalNurseDossier(nurseProfileId: string, actor: { userId: string; role: UserRole }) {
  const nurseProfile = await getAuthorizedNurseProfileForHospitalAccess(nurseProfileId, actor);

  const verifiedDocuments = await Promise.all(
    nurseProfile.verificationDocuments
      .filter((document) => document.status === VerificationDocumentStatus.VERIFIED)
      .map(async (document) => {
        const signedDownload = await createSignedDownloadUrl(document.fileUrl);
        return {
          id: document.id,
          documentType: document.documentType,
          status: document.status,
          reviewedAt: document.reviewedAt,
          objectKey: signedDownload.objectKey,
          signedUrl: signedDownload.url,
          expiresIn: signedDownload.expiresIn,
        };
      }),
  );

  return {
    nurseProfileId: nurseProfile.id,
    publicId: nurseProfile.publicId,
    displayName: nurseProfile.displayName,
    firstName: nurseProfile.firstName,
    lastName: nurseProfile.lastName,
    phoneNumber: nurseProfile.phoneNumber,
    minHourlyRate: nurseProfile.minHourlyRate,
    preferredShiftType: nurseProfile.preferredShiftType,
    isReleasedForMatching: nurseProfile.isReleasedForMatching,
    releasedAt: nurseProfile.releasedAt,
    specializations: nurseProfile.specializations.map((item) => item.tag),
    verifiedDocuments,
    signedAssignments: nurseProfile.matchContracts.map((contract) => ({
      matchContractId: contract.id,
      jobShiftId: contract.jobShift.id,
      startTime: contract.jobShift.startTime,
      endTime: contract.jobShift.endTime,
      locationCity: contract.jobShift.locationCity,
      hospitalProfileId: contract.jobShift.hospitalProfile.id,
      clinicName: contract.jobShift.hospitalProfile.clinicName,
    })),
  };
}
