import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';
import { createSignedDownloadUrl } from './storage.service';

export async function getAccessibleExamenDocument(nurseProfileId: string, actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN && actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can access examen documents');
  }

  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { id: nurseProfileId },
    include: {
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

  if (!nurseProfile.examenFileUrl) {
    throw createHttpError(404, 'No examen document available for this nurse');
  }

  const hasAccess =
    actor.role === UserRole.SUPER_ADMIN ||
    nurseProfile.matchContracts.some((contract) => contract.jobShift.hospitalProfile.userId === actor.userId);

  if (!hasAccess) {
    throw createHttpError(403, 'You are not allowed to access this examen document');
  }

  const signedDownload = await createSignedDownloadUrl(nurseProfile.examenFileUrl);

  return {
    nurseProfileId: nurseProfile.id,
    objectKey: signedDownload.objectKey,
    signedUrl: signedDownload.url,
    expiresIn: signedDownload.expiresIn,
  };
}
