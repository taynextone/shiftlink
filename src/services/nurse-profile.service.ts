import createHttpError from 'http-errors';
import { Prisma, UserRole, VerificationDocumentStatus, VerificationDocumentType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ReviewVerificationDocumentInput, SetMatchingReleaseInput, UpdateNurseProfileInput, UploadDocumentInput } from '../schemas/nurse-profile.schema';
import { recordAuditLog } from './audit.service';

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



export async function setMatchingReleaseByPublicId(
  actor: { userId: string; role: UserRole },
  input: SetMatchingReleaseInput,
) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only super admins can change matching release state');
  }

  const profile = await prisma.nurseProfile.findUnique({
    where: { publicId: input.publicId },
    include: {
      verificationDocuments: true,
    },
  });

  if (!profile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  if (input.release && !isReleasedForMatching(profile)) {
    throw createHttpError(409, 'This nurse cannot be released because required documents are not verified');
  }

  const updated = await prisma.nurseProfile.update({
    where: { id: profile.id },
    data: {
      isReleasedForMatching: input.release,
      releasedAt: input.release ? new Date() : null,
    },
    include: {
      verificationDocuments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  return {
    nurseProfile: {
      id: updated.id,
      publicId: updated.publicId,
      displayName: updated.displayName,
      isReleasedForMatching: updated.isReleasedForMatching,
      releasedAt: updated.releasedAt,
    },
    documents: updated.verificationDocuments.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      status: document.status,
      reviewedAt: document.reviewedAt,
      rejectionReason: document.rejectionReason,
      createdAt: document.createdAt,
    })),
    reason: input.reason ?? null,
  };
}

export async function getSuperadminVerificationOverviewByPublicId(
  actor: { userId: string; role: UserRole },
  publicId: string,
) {
  if (actor.role !== UserRole.SUPER_ADMIN) {
    throw createHttpError(403, 'Only super admins can access verification overview');
  }

  const profile = await prisma.nurseProfile.findUnique({
    where: { publicId },
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
    nurseProfile: {
      id: profile.id,
      publicId: profile.publicId,
      displayName: profile.displayName,
      isReleasedForMatching: profile.isReleasedForMatching,
      releasedAt: profile.releasedAt,
    },
    documents: profile.verificationDocuments.map((document) => ({
      id: document.id,
      documentType: document.documentType,
      status: document.status,
      reviewedAt: document.reviewedAt,
      rejectionReason: document.rejectionReason,
      createdAt: document.createdAt,
    })),
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
      (document: { documentType: string; status: string }) => document.documentType === VerificationDocumentType.EXAMEN && document.status === VerificationDocumentStatus.VERIFIED,
    ),
    specializations: profile.specializations.map((item: { tag: string }) => item.tag),
    availabilityBlocks: profile.availabilityBlocks.map((block: { id: string; title: string | null; city: string; postalCode: string | null; radiusKm: number; startTime: Date; endTime: Date; notes: string | null }) => ({
      id: block.id,
      title: block.title,
      city: block.city,
      postalCode: block.postalCode,
      radiusKm: block.radiusKm,
      startTime: block.startTime.toISOString(),
      endTime: block.endTime.toISOString(),
      notes: block.notes,
    })),
  };
}

export async function completeOnboarding(
  actor: { userId: string; role: UserRole },
  input: UpdateNurseProfileInput,
) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can complete onboarding');
  }

  const profile = await updateOwnNurseProfile(actor, input);

  // Note: document review is handled separately by superadmin
  // Onboarding just sets up the profile

  return {
    id: profile.id,
    displayName: profile.displayName,
    phoneNumber: profile.phoneNumber,
    whatsappOptIn: profile.whatsappOptIn,
    hasCompletedOnboarding: true,
  };
}

export async function uploadVerificationDocument(
  actor: { userId: string; role: UserRole },
  input: UploadDocumentInput,
) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can upload verification documents');
  }

  const nurseProfile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
    include: { verificationDocuments: true },
  });

  if (!nurseProfile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  // Check if document of this type already exists and is pending
  const existingDoc = nurseProfile.verificationDocuments.find(
    (doc) => doc.documentType === input.documentType && doc.status === 'PENDING',
  );

  if (existingDoc) {
    throw createHttpError(409, 'A pending document of this type already exists. Please wait for review.');
  }

  const document = await prisma.verificationDocument.create({
    data: {
      nurseProfileId: nurseProfile.id,
      documentType: input.documentType as VerificationDocumentType,
      fileUrl: `verification/${nurseProfile.id}/${input.documentType}/${Date.now()}-${input.fileName}`,
      status: VerificationDocumentStatus.PENDING,
      fileSize: input.fileSize,
      contentType: input.contentType,
    },
  });

  void recordAuditLog({
    action: 'NURSE_DOCUMENT_UPLOAD',
    actorUserId: actor.userId,
    actorRole: actor.role,
    targetEntityType: 'VerificationDocument',
    targetEntityId: document.id,
    metadata: { documentType: input.documentType, fileName: input.fileName },
  });

  return {
    id: document.id,
    documentType: document.documentType,
    status: document.status,
    fileUrl: document.fileUrl,
    uploadUrl: `/api/v1/nurse-profiles/me/documents/${document.id}/upload`,
  };
}

export async function getNurseDashboardSummary(actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.NURSE) {
    throw createHttpError(403, 'Only nurses can access nurse dashboard');
  }

  const profile = await prisma.nurseProfile.findUnique({
    where: { userId: actor.userId },
    include: {
      verificationDocuments: { orderBy: { createdAt: 'desc' } },
      matchContracts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          jobShift: { select: { title: true, locationCity: true, startTime: true, endTime: true } },
          invoices: { select: { status: true, amount: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
      availabilityBlocks: {
        where: { endTime: { gt: new Date() } },
        orderBy: { startTime: 'asc' },
        take: 5,
      },
    },
  });

  if (!profile) {
    throw createHttpError(404, 'Nurse profile not found');
  }

  // Compute onboarding completion
  const hasProfile = Boolean(profile.displayName && profile.phoneNumber);
  const hasAllDocs = REQUIRED_DOCUMENT_TYPES.every((type) =>
    profile.verificationDocuments.some((d) => d.documentType === type),
  );
  const allDocsVerified = profile.verificationDocuments.length > 0 &&
    profile.verificationDocuments.every((d) => d.status === VerificationDocumentStatus.VERIFIED);
  const hasAvailability = profile.availabilityBlocks.length > 0;

  const onboardingSteps = [
    { label: 'Profil vervollständigen', done: hasProfile },
    { label: 'Verifikationsdokumente hochladen', done: hasAllDocs },
    { label: 'Verifikation abschließen', done: allDocsVerified },
    { label: 'Matching-Freigabe erhalten', done: profile.isReleasedForMatching },
    { label: 'Verfügbarkeit eintragen', done: hasAvailability },
  ];

  const completedSteps = onboardingSteps.filter((s) => s.done).length;

  return {
    nurseProfile: {
      id: profile.id,
      publicId: profile.publicId,
      displayName: profile.displayName,
      isReleasedForMatching: profile.isReleasedForMatching,
      releasedAt: profile.releasedAt,
    },
    onboarding: {
      steps: onboardingSteps,
      completedSteps,
      totalSteps: onboardingSteps.length,
      isComplete: completedSteps === onboardingSteps.length,
    },
    documents: profile.verificationDocuments.map((d) => ({
      id: d.id,
      documentType: d.documentType,
      status: d.status,
      reviewedAt: d.reviewedAt,
    })),
    recentContracts: profile.matchContracts.map((c) => ({
      id: c.id,
      status: c.status,
      jobShift: c.jobShift,
      latestInvoice: c.invoices[0] ?? null,
      createdAt: c.createdAt,
    })),
    upcomingAvailability: profile.availabilityBlocks.map((b) => ({
      id: b.id,
      title: b.title,
      city: b.city,
      startTime: b.startTime,
      endTime: b.endTime,
    })),
  };
}

export async function getHospitalDashboardSummary(actor: { userId: string; role: UserRole }) {
  if (actor.role !== UserRole.HOSPITAL_ADMIN) {
    throw createHttpError(403, 'Only hospital admins can access hospital dashboard summary');
  }

  const profile = await prisma.hospitalProfile.findUnique({
    where: { userId: actor.userId },
    include: {
      jobShifts: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      webhookEvents: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!profile) {
    throw createHttpError(404, 'Hospital profile not found');
  }

  // Compute onboarding completion for hospital
  const hasProfile = Boolean(profile.clinicName && profile.billingAddress);
  const hasJobShifts = profile.jobShifts.length > 0;
  const hasWebhook = Boolean(profile.webhookUrl);
  const openShifts = profile.jobShifts.filter((s) => s.status === 'OPEN').length;
  const matchedShifts = profile.jobShifts.filter((s) => s.status === 'MATCHED').length;

  const onboardingSteps = [
    { label: 'Klinik-Profil vervollständigen', done: hasProfile },
    { label: 'Erste Schichten importieren', done: hasJobShifts },
    { label: 'Offers und Matching starten', done: matchedShifts > 0 },
    { label: 'Webhook konfigurieren (optional)', done: hasWebhook },
  ];

  const completedSteps = onboardingSteps.filter((s) => s.done).length;

  return {
    hospitalProfile: {
      id: profile.id,
      clinicName: profile.clinicName,
      billingAddress: profile.billingAddress,
    },
    onboarding: {
      steps: onboardingSteps,
      completedSteps,
      totalSteps: onboardingSteps.length,
      isComplete: completedSteps === onboardingSteps.length,
    },
    stats: {
      totalShifts: profile.jobShifts.length,
      openShifts,
      matchedShifts,
    },
    recentShifts: profile.jobShifts.slice(0, 5).map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      locationCity: s.locationCity,
      startTime: s.startTime,
    })),
    recentWebhookEvents: profile.webhookEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      deliveredAt: e.deliveredAt,
      deliveryAttempts: e.deliveryAttempts,
      lastError: e.lastError,
      createdAt: e.createdAt,
    })),
  };
}
