import { prisma } from '../config/prisma';
import createHttpError from 'http-errors';

export type ImportActualsRow = {
  contractId: string;
  actualHours: number;
  notes?: string;
};

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map((h) => h.trim());
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';').map((v) => v.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => { record[h] = values[idx] ?? ''; });
    records.push(record);
  }
  return records;
}

export async function importActualWorkData(
  hospitalProfileId: string,
  csvContent: string,
) {
  const records = parseCsv(csvContent);

  const results: ImportActualsRow[] = [];
  const errors: string[] = [];

  for (const record of records) {
    try {
      const contractId = record.contractId?.trim();
      const actualHours = parseFloat(record.actualHours);

      if (!contractId || isNaN(actualHours)) {
        errors.push(`Invalid row: ${JSON.stringify(record)}`);
        continue;
      }

      // Verify contract belongs to hospital
      const contract = await prisma.matchContract.findFirst({
        where: {
          id: contractId,
          jobShift: { hospitalProfileId },
        },
      });

      if (!contract) {
        errors.push(`Contract ${contractId} not found or not owned by hospital`);
        continue;
      }

      // Store actual work data (could be separate table, for now store in metadata)
      await prisma.contractActualWork.upsert({
        where: { contractId },
        create: {
          contractId,
          actualHours,
          actualStartTime: record.actualStartTime || null,
          actualEndTime: record.actualEndTime || null,
          notes: record.notes || null,
          importedAt: new Date(),
        },
        update: {
          actualHours,
          actualStartTime: record.actualStartTime || null,
          actualEndTime: record.actualEndTime || null,
          notes: record.notes || null,
          importedAt: new Date(),
        },
      });

      results.push({ contractId, actualHours, notes: record.notes });
    } catch (error) {
      errors.push(`Error processing row: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  return { imported: results.length, errors, rows: results };
}
