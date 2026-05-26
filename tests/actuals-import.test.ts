import { importActualWorkData } from '../src/services/actuals-import.service';

jest.mock('../src/config/prisma', () => ({
  prisma: {
    matchContract: {
      findFirst: jest.fn(),
    },
    contractActualWork: {
      upsert: jest.fn(),
    },
  },
}));

const { prisma } = require('../src/config/prisma');

describe('actuals import service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports valid CSV data', async () => {
    prisma.matchContract.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.contractActualWork.upsert.mockResolvedValue({ id: 'aw1' });

    const csv = 'contractId;actualHours;notes\nc1;8;Standard shift\nc2;10;Overtime';

    const result = await importActualWorkData('hp1', csv);

    expect(result.imported).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('skips rows with invalid data', async () => {
    prisma.matchContract.findFirst.mockResolvedValue({ id: 'c1' });
    prisma.contractActualWork.upsert.mockResolvedValue({ id: 'aw1' });

    const csv = 'contractId;actualHours;notes\nc1;8;Valid\n;invalid;Invalid';

    const result = await importActualWorkData('hp1', csv);

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
  });

  it('skips contracts not belonging to hospital', async () => {
    prisma.matchContract.findFirst.mockResolvedValue(null);

    const csv = 'contractId;actualHours;notes\nc99;8;Not owned';

    const result = await importActualWorkData('hp1', csv);

    expect(result.imported).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('not found');
  });

  it('handles empty CSV', async () => {
    const result = await importActualWorkData('hp1', '');

    expect(result.imported).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles CSV with only headers', async () => {
    const csv = 'contractId;actualHours;notes\n';

    const result = await importActualWorkData('hp1', csv);

    expect(result.imported).toBe(0);
    expect(result.errors).toHaveLength(0);
  });
});
