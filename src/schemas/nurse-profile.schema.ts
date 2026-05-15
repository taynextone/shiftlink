import { z } from 'zod';

const tagSchema = z.string().trim().min(2).max(80).transform((value) => value.toLowerCase());

const availabilityBlockSchema = z
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
    preferredShiftType: z.enum(['DAY', 'NIGHT', 'EARLY', 'LATE', 'FLEXIBLE']).optional(),
    minAssignmentHours: z.number().int().min(1).max(168).optional(),
    maxAssignmentHours: z.number().int().min(1).max(336).optional(),
    preferredRegionsNote: z.string().trim().min(1).max(500).optional(),
    specializationTags: z.array(tagSchema).max(20).optional(),
    availabilityBlocks: z.array(availabilityBlockSchema).max(100).optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.minAssignmentHours !== undefined &&
      value.maxAssignmentHours !== undefined &&
      value.maxAssignmentHours < value.minAssignmentHours
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'maxAssignmentHours must be greater than or equal to minAssignmentHours',
        path: ['maxAssignmentHours'],
      });
    }

    const blocks = value.availabilityBlocks;
    if (blocks) {
      const parsed = blocks.map((block, index) => ({
        index,
        start: new Date(block.startTime).getTime(),
        end: new Date(block.endTime).getTime(),
      }));

      parsed.sort((a, b) => a.start - b.start);

      for (let i = 1; i < parsed.length; i += 1) {
        if (parsed[i].start < parsed[i - 1].end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'availability blocks must not overlap',
            path: ['availabilityBlocks', parsed[i].index, 'startTime'],
          });
        }
      }
    }
  });

export type UpdateNurseProfileInput = z.infer<typeof updateNurseProfileSchema>;
