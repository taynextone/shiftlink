import { prisma } from '../config/prisma';
import { getQualipassStatus } from './qualipass.service';

export async function getHospitalDossierOverview(hospitalProfileId: string) {
  const contracts = await prisma.matchContract.findMany({
    where: {
      jobShift: { hospitalProfileId },
    },
    include: {
      nurseProfile: {
        include: {
          verificationDocuments: true,
          user: {
            select: { mosUserId: true },
          },
        },
      },
      jobShift: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // QualiPass-Status parallel (Redis-Cached) abholen
  const uniqueNurses = new Map<string, number | null>();
  for (const contract of contracts) {
    if (!uniqueNurses.has(contract.nurseProfileId)) {
      uniqueNurses.set(contract.nurseProfileId, contract.nurseProfile.user?.mosUserId ?? null);
    }
  }
  const qualipassByNurse = new Map(
    await Promise.all(
      [...uniqueNurses.entries()].map(async ([nurseProfileId, mosUserId]) => {
        return [nurseProfileId, await getQualipassStatus(mosUserId)] as const;
      }),
    ),
  );

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
        qualipassStatus: qualipassByNurse.get(contract.nurseProfileId) ?? null,
        signedAssignmentsCount: signedAssignments.length,
        verifiedDocumentsCount: contract.nurseProfile.verificationDocuments.filter(
          (d) => d.status === 'VERIFIED',
        ).length,
        lastAssignmentDate: lastAssignment?.jobShift.startTime.toISOString() ?? null,
      };
    });

  return { dossiers };
}
