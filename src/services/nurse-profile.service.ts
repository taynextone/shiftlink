import createHttpError from 'http-errors';
import { Prisma, UserRole, VerificationDocumentStatus, VerificationDocumentType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ReviewVerificationDocumentInput, UpdateNurseProfileInput } from '../schemas/nurse-profile.schema';

const REQUIRED_DOCUMENT_TYPES: VerificationDocumentType[] = [
  VerificationDocumentType.EXAMEN,
  VerificationDocumentType.OCCUPATIONAL_HEALTH_CLEARANCE,
];

function buildVerificationDocumentsCreate(input: UpdateNurseProfileInput): Prisma.VerificationDocumentCreateWithoutNurseProfileInput[] {
  const docs: Prisma.VerificationDocumentCreateWithoutNurseProfileInput[] = [];

  if (input.examenFileUrl) {
    docs.push({
      documentType: VerificationDocumentType.EXAMEN,
      fileUrl: input.examenFileUrl,
      status: VerificationDocumentStatus.PENDING,
    });
  }

  for (const fileUrl of input.specializationCertificateFileUrls ?? []) {
    docs.push({
      documentType: VerificationDocumentType.SPECIALIZATION_CERTIFICATE,
      fileUrl,
      status: VerificationDocumentStatus.PENDING,
    });
  }

  for (const fileUrl of input.occupationalHealthClearanceFileUrls ?? []) {
    docs.push({
      documentType: VerificationDocumentType.OCCUPATIONAL_HEALTH_CLEARANCE,
      fileUrl,
      status: VerificationDocumentStatus.PENDING,
    });
  }

  return docs;
}

function isReleasedForMatching(profile: { verificationDocuments: Array<{ documentType: VerificationDocumentType; status: VerificationDocumentStatus }> }) {
  const byType = new Map<VerificationDocumentType, VerificationDocumentStatus[]>();

  for (const document of profile.verificationDocuments) {
    const existing = byType.get(document.documentType) ?? [];
    existing.push(document.status);
    byType.set(document.documentType, existing);
  }

  return REQUIRED_DOCUMENT_TYPES.every((type) => (byType.get(type) ?? []).includes(VerificationDocumentStatus.VERIFIED));
}

export async function updateOwnNurseProfile(actor: { userId: string; role: UserRole }, input: UpdateNurseProfileInput) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can update nurse profiles');
  }

  const existingProfile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
    include: {
      availabilityBlocks: true,
      verificationDocuments: true,
    },
  });

  if (!existingProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  const bookedBlocks = existingProfile.availabilityBlocks.filter((block) => block.isBooked);

  if (bookedBlocks.length > 0 && input.availabilityBlocks) {
    throw createHttpError(409, 'Booked availability blocks cannot be replaced through the general profile update flow');
  }

  const newVerificationDocuments = buildVerificationDocumentsCreate(input);
  const shouldResetRelease = newVerificationDocuments.length > 0;

  const data: Prisma.NurseProfileUpdateInput = {
    displayName: input.displayName,
    firstName: input.firstName,
    lastName: input.lastName,
    iban: input.iban,
    minHourlyRate: input.minHourlyRate !== undefined ? new Prisma.Decimal(input.minHourlyRate) : undefined,
    phoneNumber: input.phoneNumber,
    whatsappOptIn: input.whatsappOptIn,
    examenFileUrl: input.examenFileUrl,
    preferredShiftType: input.preferredShiftType,
    minAssignmentHours: input.minAssignmentHours,
    maxAssignmentHours: input.maxAssignmentHours,
    preferredRegionsNote: input.preferredRegionsNote,
    isReleasedForMatching: shouldResetRelease ? false : undefined,
    releasedAt: shouldResetRelease ? null : undefined,
    specializations: input.specializationTags
      ? {
          deleteMany: {},
          create: input.specializationTags.map((tag) => ({ tag })),
        }
      : undefined,
    verificationDocuments: newVerificationDocuments.length > 0
      ? {
          create: newVerificationDocuments,
        }
      : undefined,
    availabilityBlocks: input.availabilityBlocks
      ? {
          deleteMany: {},
          create: input.availabilityBlocks.map((block) => ({
            title: block.title,
            city: block.city,
            postalCode: block.postalCode,
            latitude: block.latitude !== undefined ? new Prisma.Decimal(block.latitude) : undefined,
            longitude: block.longitude !== undefined ? new Prisma.Decimal(block.longitude) : undefined,
            radiusKm: block.radiusKm,
            startTime: new Date(block.startTime),
            endTime: new Date(block.endTime),
            notes: block.notes,
          })),
        }
      : undefined,
  };

  return prisma.nurseProfile.update({
    where: { userId: actor.userId },
    data,
    include: {
      specializations: true,
      verificationDocuments: true,
      availabilityBlocks: true,
    },
  });
}

export async function reviewVerificationDocument(
  actor: { userId: string; role: UserRole },
  input: ReviewVerificationDocumentInput,
) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only super admins can review verification documents');
  }

  const document = await prisma.verificationDocument.findUnique({
    where: { id: input.documentId },
    include: {
      nurseProfile: {
        include: {
          verificationDocuments: true,
        },
      },
    },
  });

  if (!document) {
    throw createHttpError(404, 'Verification document not found');
  }

  const updatedDocument = await prisma.verificationDocument.update({
    where: { id: input.documentId },
    data: {
      status: input.status,
      reviewerUserId: actor.userId,
      reviewedAt: new Date(),
      rejectionReason: input.status === 'REJECTED' ? input.rejectionReason : null,
    },
    include: {
      nurseProfile: {
        include: {
          verificationDocuments: true,
        },
      },
    },
  });

  const release = isReleasedForMatching(updatedDocument.nurseProfile);

  await prisma.nurseProfile.update({
    where: { id: updatedDocument.nurseProfile.id },
    data: {
      isReleasedForMatching: release,
      releasedAt: release ? new Date() : null,
    },
  });

  return updatedDocument;
}

export async function getOwnVerificationOverview(actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can access verification overview');
  }

  const profile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
    include: {
      verificationDocuments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!profile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  return {
    isReleasedForMatching: profile.isReleasedForMatching,
    releasedAt: profile.releasedAt,
    documents: profile.verificationDocuments,
  };
}

export async function getPublicNurseProfile(publicId: string) {
  const profile = await prisma.nurseProfile.findUnique({
    where: { publicId },
    include: {
      specializations: true,
      verificationDocuments: true,
      availabilityBlocks: {
        where: {
          isBooked: false,
        },
        orderBy: {
          startTime: 'asc',
        },
      },
    },
  });

  if (!profile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  return {
    publicId: profile.publicId,
    displayName: profile.displayName,
    minHourlyRate: profile.minHourlyRate,
    preferredShiftType: profile.preferredShiftType,
    minAssignmentHours: profile.minAssignmentHours,
    maxAssignmentHours: profile.maxAssignmentHours,
    preferredRegionsNote: profile.preferredRegionsNote,
    isReleasedForMatching: profile.isReleasedForMatching,
    hasVerifiedExamen: profile.verificationDocuments.some(
      (document) => document.documentType === VerificationDocumentType.EXAMEN && document.status === VerificationDocumentStatus.VERIFIED,
    ),
    specializations: profile.specializations.map((item) => item.tag),
    availabilityBlocks: profile.availabilityBlocks.map((block) => ({
      id: block.id,
      title: block.title,
      city: block.city,
      postalCode: block.postalCode,
      radiusKm: block.radiusKm,
      startTime: block.startTime,
      endTime: block.endTime,
      notes: block.notes,
    })),
  };
}
