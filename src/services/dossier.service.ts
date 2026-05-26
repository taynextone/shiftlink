import { prisma } from '../config/prisma';

export async function getHospitalDossierOverview(hospitalProfileId: string) {
  const contracts = await prisma.matchContract.findMany({
    where: {
      jobShift: { hospitalProfileId },
    },
    include: {
      nurseProfile: {
        include: {
          verificationDocuments: true,
        },
      },
      jobShift: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Deduplicate by nurseProfileId, keeping the most recent contract
  const seenNurses = new Set<string>();
  const dossiers = contracts
    .filter((contract) => {
      if (seenNurses.has(contract.nurseProfileId)) return false;
      seenNurses.add(contract.nurseProfileId);
      return true;
    })
    .map((contract) => {
      const signedAssignments = contracts.filter(
        (c) => c.nurseProfileId === contract.nurseProfileId && c.status === 'SIGNED',
      );
      const lastAssignment = signedAssignments[0];

      return {
        nurseProfileId: contract.nurseProfileId,
        publicId: contract.nurseProfile.publicId,
        displayName: contract.nurseProfile.displayName,
        isReleasedForMatching: contract.nurseProfile.isReleasedForMatching,
        signedAssignmentsCount: signedAssignments.length,
        verifiedDocumentsCount: contract.nurseProfile.verificationDocuments.filter(
          (d) => d.status === 'VERIFIED',
        ).length,
        lastAssignmentDate: lastAssignment?.jobShift.startTime.toISOString() ?? null,
      };
    });

  return { dossiers };
}
