import { signContract, requestSignature } from '../src/services/esignature.service';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    matchContract: {
      findUnique: jest.fn(),
    },
    contractSignatureEvent: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const { prisma } = require('../src/config/prisma');
prisma.matchContract.update = jest.fn().mockResolvedValue({});

describe('esignature service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestSignature', () => {
    it('returns signature status', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'ACTIVE',
        nurseProfile: { userId: 'n1', displayName: 'Nurse' },
        jobShift: { hospitalProfile: { userId: 'h1', clinicName: 'Clinic' } },
      });
      prisma.contractSignatureEvent.findMany.mockResolvedValue([
        { signerRole: 'HOSPITAL_ADMIN' },
      ]);

      const result = await requestSignature('c1', 'HOSPITAL');

      expect(result.hospitalSigned).toBe(true);
      expect(result.nurseSigned).toBe(false);
      expect(result.fullySigned).toBe(false);
    });

    it('throws when contract not found', async () => {
      prisma.matchContract.findUnique.mockResolvedValue(null);

      await expect(requestSignature('unknown', 'HOSPITAL')).rejects.toThrow('not found');
    });

    it('throws when contract is not active', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'PENDING',
      });

      await expect(requestSignature('c1', 'HOSPITAL')).rejects.toThrow('must be active');
    });
  });

  describe('signContract', () => {
    it('allows hospital to sign', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'ACTIVE',
        nurseProfile: { userId: 'n1', displayName: 'NurseNova', firstName: 'Nova' },
        jobShift: { hospitalProfile: { userId: 'h1', clinicName: 'ClinicOne', title: 'ITS Nachtdienst', startTime: new Date('2026-06-16T22:00:00.000Z'), endTime: new Date('2026-06-20T06:00:00.000Z') } },
      });
      prisma.contractSignatureEvent.findUnique.mockResolvedValue(null);
      prisma.contractSignatureEvent.create.mockResolvedValue({
        contractId: 'c1',
        signerRole: 'HOSPITAL_ADMIN',
        signedAt: new Date(),
      });
      prisma.contractSignatureEvent.findMany.mockResolvedValue([
        { signerRole: 'HOSPITAL_ADMIN' },
      ]);

      const result = await signContract('c1', 'HOSPITAL', { userId: 'h1', role: 'HOSPITAL_ADMIN' }, 'I consent');

      expect(result.signed).toBe(true);
      expect(result.party).toBe('HOSPITAL_ADMIN');
    });

    it('throws when hospital owner mismatch', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'ACTIVE',
        nurseProfile: { userId: 'n1' },
        jobShift: { hospitalProfile: { userId: 'other' } },
      });

      await expect(signContract('c1', 'HOSPITAL', { userId: 'h1', role: 'HOSPITAL_ADMIN' }, 'I consent'))
        .rejects.toThrow('hospital owner');
    });

    it('throws when already signed', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'ACTIVE',
        nurseProfile: { userId: 'n1', displayName: 'NurseNova', firstName: 'Nova' },
        jobShift: { hospitalProfile: { userId: 'h1', clinicName: 'ClinicOne', title: 'ITS', startTime: new Date('2026-06-16T22:00:00.000Z'), endTime: new Date('2026-06-20T06:00:00.000Z') } },
      });
      prisma.contractSignatureEvent.findUnique.mockResolvedValue({ id: 'sig1' });

      await expect(signContract('c1', 'HOSPITAL', { userId: 'h1', role: 'HOSPITAL_ADMIN' }, 'I consent'))
        .rejects.toThrow('already signed');
    });

    it('marks fully executed when both parties signed', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'ACTIVE',
        nurseProfile: { userId: 'n1', displayName: 'NurseNova', firstName: 'Nova' },
        jobShift: { hospitalProfile: { userId: 'h1', clinicName: 'ClinicOne', title: 'ITS', startTime: new Date('2026-06-16T22:00:00.000Z'), endTime: new Date('2026-06-20T06:00:00.000Z') } },
      });
      prisma.contractSignatureEvent.findUnique.mockResolvedValue(null);
      prisma.contractSignatureEvent.create.mockResolvedValue({
        contractId: 'c1',
        signerRole: 'NURSE',
        signedAt: new Date(),
      });
      prisma.contractSignatureEvent.findMany.mockResolvedValue([
        { signerRole: 'HOSPITAL_ADMIN' },
        { signerRole: 'NURSE' },
      ]);

      const result = await signContract('c1', 'NURSE', { userId: 'n1', role: 'NURSE' }, 'I consent');

      expect(result.fullyExecuted).toBe(true);
      expect(prisma.matchContract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: { executionStatus: 'FULLY_EXECUTED', fullyExecutedAt: expect.any(Date) },
        }),
      );
    });
  });
});
