import createHttpError from 'http-errors';
import { prisma } from '../config/prisma';

export type PaperContractStatus = 'NOT_REQUIRED' | 'PENDING' | 'SIGNED' | 'WAIVED';

/**
 * Update the paper contract status for a match contract.
 * Called when a paper signature is collected on-site or explicitly waived.
 */
export async function updatePaperContractStatus(
  matchContractId: string,
  status: PaperContractStatus,
  actor: { userId: string; role: string },
) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  // Only hospital admins or super admins can update paper contract status
  if (!actor.role.includes('ADMIN')) {
    throw createHttpError(403, 'Only hospital admins can update paper contract status');
  }

  return prisma.matchContract.update({
    where: { id: matchContractId },
    data: {
      paperContractStatus: status,
      ...(status === 'SIGNED' ? { paperContractSignedAt: new Date() } : {}),
    },
  });
}

/**
 * Get summary of both digital and paper signing status.
 */
export async function getHybridSignatureStatus(matchContractId: string) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: matchContractId },
    include: {
      signatureEvents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  const digitalSignatures = contract.signatureEvents ?? [];
  const hospitalSigned = digitalSignatures.some((s: { signerRole: string }) => s.signerRole === 'HOSPITAL_ADMIN');
  const nurseSigned = digitalSignatures.some((s: { signerRole: string }) => s.signerRole === 'NURSE');
  const digitalFullySigned = hospitalSigned && nurseSigned;

  const paperStatus = (contract.paperContractStatus ?? 'NOT_REQUIRED') as PaperContractStatus;
  const paperSigned = paperStatus === 'SIGNED';
  const paperWaived = paperStatus === 'WAIVED';

  return {
    contractId: matchContractId,
    digital: {
      hospitalSigned,
      nurseSigned,
      fullySigned: digitalFullySigned,
      signatureCount: digitalSignatures.length,
    },
    paper: {
      status: paperStatus,
      signed: paperSigned,
      waived: paperWaived,
      signedAt: contract.paperContractSignedAt,
    },
    hybridComplete: digitalFullySigned && (paperSigned || paperWaived || paperStatus === 'NOT_REQUIRED'),
  };
}
