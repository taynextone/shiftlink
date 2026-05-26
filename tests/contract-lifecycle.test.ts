process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long-for-validation';

jest.mock('../src/config/queues', () => ({
  billingQueue: { add: jest.fn().mockResolvedValue({ id: 'job_1' }) },
}));

import { activateContract, reportNoShow, cancelByHospital, completeContract, setNoShowDeadline } from '../src/services/contract-lifecycle.service';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    matchContract: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../src/config/prisma');

describe('contract lifecycle service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('activateContract', () => {
    it('activates a signed contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'SIGNED' });
      prisma.matchContract.update.mockResolvedValue({ id: 'c1', status: 'ACTIVE' });

      const result = await activateContract('c1');

      expect(prisma.matchContract.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'c1' },
          data: { status: 'ACTIVE', activatedAt: expect.any(Date) },
        }),
      );
      expect(result.status).toBe('ACTIVE');
    });

    it('throws when contract not found', async () => {
      prisma.matchContract.findUnique.mockResolvedValue(null);

      await expect(activateContract('unknown')).rejects.toThrow('not found');
    });

    it('throws when contract is not signed', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'PENDING' });

      await expect(activateContract('c1')).rejects.toThrow('Only signed contracts');
    });
  });

  describe('reportNoShow', () => {
    it('reports no-show for signed contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'SIGNED',
        noShowDeadline: new Date(Date.now() + 3600000),
        invoiceId: null,
        jobShift: { hospitalProfile: { userId: 'h1' } },
      });
      prisma.matchContract.update.mockResolvedValue({ id: 'c1', status: 'NO_SHOW_REPORTED' });
      prisma.matchContract.findUnique.mockResolvedValueOnce({
        id: 'c1',
        status: 'SIGNED',
        noShowDeadline: new Date(Date.now() + 3600000),
        invoiceId: null,
        jobShift: { hospitalProfile: { userId: 'h1' } },
      }).mockResolvedValueOnce({
        id: 'c1',
        status: 'NO_SHOW_REPORTED',
        invoice: null,
      });

      const result = await reportNoShow('c1', { userId: 'h1', role: 'HOSPITAL_ADMIN' });

      expect(result.status).toBe('NO_SHOW_REPORTED');
    });

    it('throws when deadline passed', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({
        id: 'c1',
        status: 'SIGNED',
        noShowDeadline: new Date(Date.now() - 3600000),
        jobShift: { hospitalProfile: { userId: 'h1' } },
      });

      await expect(reportNoShow('c1', { userId: 'h1', role: 'HOSPITAL_ADMIN' })).rejects.toThrow('deadline');
    });
  });

  describe('cancelByHospital', () => {
    it('cancels an active contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'ACTIVE' });
      prisma.matchContract.update.mockResolvedValue({ id: 'c1', status: 'CANCELED_BY_HOSPITAL' });

      const result = await cancelByHospital('c1', 'Pflegekrraft krank');

      expect(result.status).toBe('CANCELED_BY_HOSPITAL');
    });

    it('throws for non-active contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'PENDING' });

      await expect(cancelByHospital('c1', 'reason')).rejects.toThrow('signed or active');
    });
  });

  describe('completeContract', () => {
    it('completes an active contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'ACTIVE' });
      prisma.matchContract.update.mockResolvedValue({ id: 'c1', status: 'COMPLETED' });

      const result = await completeContract('c1');

      expect(result.status).toBe('COMPLETED');
    });

    it('throws for non-active contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'SIGNED' });

      await expect(completeContract('c1')).rejects.toThrow('Only active contracts');
    });
  });

  describe('setNoShowDeadline', () => {
    it('sets 24h deadline for signed contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'SIGNED' });
      prisma.matchContract.update.mockResolvedValue({ id: 'c1', noShowDeadline: new Date() });

      const result = await setNoShowDeadline('c1');

      expect(result.noShowDeadline).toBeDefined();
    });

    it('throws for non-signed contract', async () => {
      prisma.matchContract.findUnique.mockResolvedValue({ id: 'c1', status: 'ACTIVE' });

      await expect(setNoShowDeadline('c1')).rejects.toThrow('signed contracts');
    });
  });
});
