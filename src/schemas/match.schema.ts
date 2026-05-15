import { z } from 'zod';

export const signMatchContractSchema = z.object({
  matchContractId: z.string().trim().min(1),
});

export const findCandidatesSchema = z.object({
  jobShiftId: z.string().trim().min(1),
});

export const createMatchOfferSchema = z.object({
  jobShiftId: z.string().trim().min(1),
  nurseProfileId: z.string().trim().min(1),
});

export const listVisibleJobShiftsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const respondToMatchOfferSchema = z.object({
  matchContractId: z.string().trim().min(1),
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export type SignMatchContractInput = z.infer<typeof signMatchContractSchema>;
export type FindCandidatesInput = z.infer<typeof findCandidatesSchema>;
export type CreateMatchOfferInput = z.infer<typeof createMatchOfferSchema>;
export type ListVisibleJobShiftsInput = z.infer<typeof listVisibleJobShiftsSchema>;
export type RespondToMatchOfferInput = z.infer<typeof respondToMatchOfferSchema>;
