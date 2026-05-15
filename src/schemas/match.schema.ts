import { z } from 'zod';

export const signMatchContractSchema = z.object({
  matchContractId: z.string().trim().min(1),
});

export const findCandidatesSchema = z.object({
  jobShiftId: z.string().trim().min(1),
});

export type SignMatchContractInput = z.infer<typeof signMatchContractSchema>;
export type FindCandidatesInput = z.infer<typeof findCandidatesSchema>;
