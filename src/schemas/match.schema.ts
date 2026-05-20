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

export const listHospitalMatchOffersSchema = z.object({
  jobShiftId: z.string().trim().min(1),
});

export const respondToMatchOfferSchema = z.object({
  matchContractId: z.string().trim().min(1),
  action: z.enum(['ACCEPT', 'DECLINE']),
});

export type SignMatchContractInput = z.infer<typeof signMatchContractSchema>;
export type FindCandidatesInput = z.infer<typeof findCandidatesSchema>;
export type CreateMatchOfferInput = z.infer<typeof createMatchOfferSchema>;
export type ListVisibleJobShiftsInput = z.infer<typeof listVisibleJobShiftsSchema>;
export type ListHospitalMatchOffersInput = z.infer<typeof listHospitalMatchOffersSchema>;
export const signContractExecutionSchema = z.object({
  matchContractId: z.string().trim().min(1),
});

export const voidContractExecutionSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
});

export type RespondToMatchOfferInput = z.infer<typeof respondToMatchOfferSchema>;
export type SignContractExecutionInput = z.infer<typeof signContractExecutionSchema>;
export type VoidContractExecutionInput = z.infer<typeof voidContractExecutionSchema>;
