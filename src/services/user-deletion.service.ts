import createHttpError from 'http-errors';
import { UserRole } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * Deletes a user account and all associated data.
 * Cascading deletes are handled by Prisma schema (onDelete: Cascade).
 *
 * For GDPR compliance ("right to erasure"):
 * - Audit logs are anonymized (actorUserId set to null) before user deletion
 * - User record is hard-deleted
 * - All related profiles, documents, contracts, invoices cascade-delete automatically
 */
export async function deleteOwnAccount(userId: string, _role: UserRole): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  // Anonymize audit logs that reference this user as actor
  await prisma.auditLog.updateMany({
    where: { actorUserId: userId },
    data: { actorUserId: '' },
  });

  // Delete the user — cascades to profiles, documents, etc. via onDelete: Cascade
  await prisma.user.delete({
    where: { id: userId },
  });
}

/**
 * Exports all user data as a JSON object for GDPR "right to data portability".
 */
export async function exportUserData(userId: string, _role: UserRole): Promise<Record<string, unknown>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      nurseProfile: {
        include: {
          verificationDocuments: { orderBy: { createdAt: 'desc' } },
          specializations: true,
          availabilityBlocks: { orderBy: { startTime: 'asc' } },
        },
      },
      hospitalProfile: true,
    },
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const nurseProfileId = user.nurseProfile?.id;
  const hospitalProfileId = user.hospitalProfile?.id;

  // Fetch audit logs where user was actor
  const auditLogs = await prisma.auditLog.findMany({
    where: { actorUserId: userId },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch match contracts and related data
  const matchContracts = nurseProfileId
    ? await prisma.matchContract.findMany({
        where: { nurseProfileId },
        include: {
          jobShift: true,
          invoices: { orderBy: { createdAt: 'desc' } },
          contractSnapshot: true,
          signatureEvents: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  // Fetch job shifts created by this hospital
  const jobShifts = hospitalProfileId
    ? await prisma.jobShift.findMany({
        where: { hospitalProfileId },
        include: {
          matchContracts: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    nurseProfile: user.nurseProfile
      ? {
          id: user.nurseProfile.id,
          publicId: user.nurseProfile.publicId,
          displayName: user.nurseProfile.displayName,
          firstName: user.nurseProfile.firstName,
          lastName: user.nurseProfile.lastName,
          iban: user.nurseProfile.iban,
          minHourlyRate: user.nurseProfile.minHourlyRate,
          phoneNumber: user.nurseProfile.phoneNumber,
          whatsappOptIn: user.nurseProfile.whatsappOptIn,
          isReleasedForMatching: user.nurseProfile.isReleasedForMatching,
          releasedAt: user.nurseProfile.releasedAt,
          specializations: user.nurseProfile.specializations.map((s) => s.tag),
          availabilityBlocks: user.nurseProfile.availabilityBlocks.map((b) => ({
            id: b.id,
            title: b.title,
            city: b.city,
            startTime: b.startTime,
            endTime: b.endTime,
            radiusKm: b.radiusKm,
            postalCode: b.postalCode,
          })),
          preferredRegionsNote: user.nurseProfile.preferredRegionsNote,
          verificationDocuments: user.nurseProfile.verificationDocuments.map((d) => ({
            id: d.id,
            documentType: d.documentType,
            status: d.status,
            fileUrl: d.fileUrl,
            reviewedAt: d.reviewedAt,
            rejectionReason: d.rejectionReason,
            createdAt: d.createdAt,
          })),
        }
      : null,
    hospitalProfile: user.hospitalProfile
      ? {
          id: user.hospitalProfile.id,
          clinicName: user.hospitalProfile.clinicName,
          billingAddress: user.hospitalProfile.billingAddress,
          taxNumber: user.hospitalProfile.taxNumber,
        }
      : null,
    matchContracts,
    jobShifts,
    auditLogs,
  };
}
