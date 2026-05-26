import { prisma } from '../config/prisma';
import createHttpError from 'http-errors';

export type SignatureParty = 'HOSPITAL' | 'NURSE';

function partyToRole(party: SignatureParty): 'HOSPITAL_ADMIN' | 'NURSE' {
  return party === 'HOSPITAL' ? 'HOSPITAL_ADMIN' : 'NURSE';
}

export async function requestSignature(contractId: string, requestedBy: SignatureParty) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: contractId },
    include: { jobShift: { include: { hospitalProfile: true } }, nurseProfile: true },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  if (contract.status !== 'ACTIVE') {
    throw createHttpError(409, 'Contract must be active before signing');
  }

  // Check existing signatures
  const signatures = await prisma.contractSignatureEvent.findMany({
    where: { matchContractId: contractId },
  });

  const hospitalSigned = signatures.some((s) => s.signerRole === 'HOSPITAL_ADMIN');
  const nurseSigned = signatures.some((s) => s.signerRole === 'NURSE');

  return {
    contractId,
    hospitalSigned,
    nurseSigned,
    fullySigned: hospitalSigned && nurseSigned,
    status: contract.status,
  };
}

export async function signContract(
  contractId: string,
  party: SignatureParty,
  actor: { userId: string; role: string },
  consentText: string,
) {
  const contract = await prisma.matchContract.findUnique({
    where: { id: contractId },
    include: { jobShift: { include: { hospitalProfile: true } }, nurseProfile: true },
  });

  if (!contract) {
    throw createHttpError(404, 'Contract not found');
  }

  // Verify actor is authorized for this party
  if (party === 'HOSPITAL' && actor.userId !== contract.jobShift.hospitalProfile.userId) {
    throw createHttpError(403, 'Only the hospital owner can sign for the hospital');
  }
  if (party === 'NURSE' && actor.userId !== contract.nurseProfile.userId) {
    throw createHttpError(403, 'Only the nurse can sign for the nurse');
  }

  // Check if already signed
  const existing = await prisma.contractSignatureEvent.findUnique({
    where: { matchContractId_signerUserId: { matchContractId: contractId, signerUserId: actor.userId } },
  });

  if (existing) {
    throw createHttpError(409, `${party} has already signed this contract`);
  }

  const signatureText =
    party === 'HOSPITAL'
      ? `Ich, ${contract.jobShift.hospitalProfile.clinicName}, bestätige hiermit den Vertrag mit ${contract.nurseProfile.displayName} für den Einsatz "${contract.jobShift.title ?? 'Pflegeeinsatz'}" vom ${contract.jobShift.startTime.toLocaleDateString('de-DE')} bis ${contract.jobShift.endTime.toLocaleDateString('de-DE')}.`
      : `Ich, ${contract.nurseProfile.displayName}, bestätige hiermit den Vertrag mit ${contract.jobShift.hospitalProfile.clinicName} für den Einsatz "${contract.jobShift.title ?? 'Pflegeeinsatz'}" vom ${contract.jobShift.startTime.toLocaleDateString('de-DE')} bis ${contract.jobShift.endTime.toLocaleDateString('de-DE')}.`;

  const signed = await prisma.contractSignatureEvent.create({
    data: {
      matchContractId: contractId,
      signerUserId: actor.userId,
      signerRole: partyToRole(party),
      signatureIntent: `Contract signature by ${party}`,
      signatureEvidenceJson: JSON.stringify({
        consentText,
        signedAt: new Date().toISOString(),
        party,
      }),
    },
  });

  // Check if both parties signed → mark as fully executed
  const allSignatures = await prisma.contractSignatureEvent.findMany({
    where: { matchContractId: contractId },
  });

  const hospitalDone = allSignatures.some((s) => s.signerRole === 'HOSPITAL_ADMIN');
  const nurseDone = allSignatures.some((s) => s.signerRole === 'NURSE');

  if (hospitalDone && nurseDone) {
    await prisma.matchContract.update({
      where: { id: contractId },
      data: { executionStatus: 'FULLY_EXECUTED', fullyExecutedAt: new Date() },
    });
  }

  return {
    contractId,
    party: signed.signerRole,
    signed: true,
    fullyExecuted: hospitalDone && nurseDone,
  };
}
