import { z } from 'zod';

export const updateNurseProfileSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    iban: z.string().trim().min(15).max(34).optional(),
    minHourlyRate: z.number().positive().min(1).optional(),
    phoneNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'phoneNumber must be in E.164 format').optional(),
    whatsappOptIn: z.boolean().optional(),
    examenFileUrl: z.string().trim().min(1).optional(),
    availabilityCity: z.string().trim().min(1).max(120).optional(),
    availabilityPostalCode: z.string().trim().min(3).max(20).optional(),
    availabilityLatitude: z.number().min(-90).max(90).optional(),
    availabilityLongitude: z.number().min(-180).max(180).optional(),
    availabilityRadiusKm: z.number().int().min(1).max(500).optional(),
    isAvailable: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const hasLat = value.availabilityLatitude !== undefined;
    const hasLng = value.availabilityLongitude !== undefined;

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'availabilityLatitude and availabilityLongitude must be provided together',
        path: hasLat ? ['availabilityLongitude'] : ['availabilityLatitude'],
      });
    }

    if (value.isAvailable === true && value.availabilityRadiusKm === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'availabilityRadiusKm is required when isAvailable is true',
        path: ['availabilityRadiusKm'],
      });
    }
  });

export type UpdateNurseProfileInput = z.infer<typeof updateNurseProfileSchema>;
