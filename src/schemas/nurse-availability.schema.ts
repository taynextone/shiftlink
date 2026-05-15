import { z } from 'zod';

const baseBlockSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    city: z.string().trim().min(1).max(120),
    postalCode: z.string().trim().min(3).max(20).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radiusKm: z.number().int().min(1).max(500),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    notes: z.string().trim().min(1).max(500).optional(),
  })
  .superRefine((value, ctx) => {
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

export const createAvailabilityBlockSchema = baseBlockSchema;

export const replaceAvailabilityBlocksSchema = z.object({
  blocks: z.array(baseBlockSchema).max(100),
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

export type CreateAvailabilityBlockInput = z.infer<typeof createAvailabilityBlockSchema>;
export type ReplaceAvailabilityBlocksInput = z.infer<typeof replaceAvailabilityBlocksSchema>;
export type CopyAvailabilityBlockInput = z.infer<typeof copyAvailabilityBlockSchema>;
