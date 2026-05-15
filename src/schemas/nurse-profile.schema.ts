import { z } from 'zod';

const tagSchema = z.string().trim().min(2).max(80).transform((value) => value.toLowerCase());

export const updateNurseProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(80).optional(),
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
    specializationTags: z.array(tagSchema).max(20).optional(),
    availabilityWindows: z
      .array(
        z.object({
          startTime: z.iso.datetime(),
          endTime: z.iso.datetime(),
        }),
      )
      .max(50)
      .optional(),
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

    value.availabilityWindows?.forEach((window, index) => {
      if (new Date(window.endTime) <= new Date(window.startTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'availability window endTime must be after startTime',
          path: ['availabilityWindows', index, 'endTime'],
        });
      }
    });
  });

export type UpdateNurseProfileInput = z.infer<typeof updateNurseProfileSchema>;
