import { z } from 'zod';

const availabilityBlockFields = {
  title: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(120),
  postalCode: z.string().trim().min(3).max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().int().min(1).max(500),
  startTime: z.iso.datetime(),
  endTime: z.iso.datetime(),
  notes: z.string().trim().min(1).max(500).optional(),
} as const;

export const createAvailabilityBlockSchema = z.object(availabilityBlockFields).superRefine((value, ctx) => {
  const hasLat = value.latitude !== undefined;
  const hasLng = value.longitude !== undefined;

  if (hasLat !== hasLng) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'latitude and longitude must be provided together',
      path: hasLat ? ['longitude'] : ['latitude'],
    });
  }

  if (new Date(value.endTime) <= new Date(value.startTime)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'availability block endTime must be after startTime',
      path: ['endTime'],
    });
  }
});

export const updateAvailabilityBlockSchema = z
  .object({
    title: availabilityBlockFields.title,
    city: availabilityBlockFields.city.optional(),
    postalCode: availabilityBlockFields.postalCode,
    latitude: availabilityBlockFields.latitude,
    longitude: availabilityBlockFields.longitude,
    radiusKm: availabilityBlockFields.radiusKm.optional(),
    startTime: availabilityBlockFields.startTime.optional(),
    endTime: availabilityBlockFields.endTime.optional(),
    notes: availabilityBlockFields.notes,
  })
  .superRefine((value, ctx) => {
    if (value.startTime && value.endTime && new Date(value.endTime) <= new Date(value.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'availability block endTime must be after startTime',
        path: ['endTime'],
      });
    }

    const hasLat = value.latitude !== undefined;
    const hasLng = value.longitude !== undefined;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'latitude and longitude must be provided together',
        path: hasLat ? ['longitude'] : ['latitude'],
      });
    }
  });

export const replaceAvailabilityBlocksSchema = z.object({
  blocks: z.array(createAvailabilityBlockSchema).max(100),
});

export const copyAvailabilityBlockSchema = z.object({
  sourceBlockId: z.string().trim().min(1),
  copies: z
    .array(
      z.object({
        startTime: z.iso.datetime(),
        endTime: z.iso.datetime(),
      }),
    )
    .min(1)
    .max(30),
});

export const setAvailabilityBlockBookedSchema = z.object({
  isBooked: z.boolean(),
});

export type CreateAvailabilityBlockInput = z.infer<typeof createAvailabilityBlockSchema>;
export type UpdateAvailabilityBlockInput = z.infer<typeof updateAvailabilityBlockSchema>;
export type ReplaceAvailabilityBlocksInput = z.infer<typeof replaceAvailabilityBlocksSchema>;
export type CopyAvailabilityBlockInput = z.infer<typeof copyAvailabilityBlockSchema>;
export type SetAvailabilityBlockBookedInput = z.infer<typeof setAvailabilityBlockBookedSchema>;
