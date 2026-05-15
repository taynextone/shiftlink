import { z } from 'zod';

const requirementSchema = z.object({
  tag: z.string().trim().min(2).max(80).transform((value) => value.toLowerCase()),
  priority: z.enum(['REQUIRED', 'PREFERRED']),
});

export const createJobShiftSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    department: z.string().trim().min(1).max(120).optional(),
    stationName: z.string().trim().min(1).max(120).optional(),
    locationCity: z.string().trim().min(1).max(120),
    locationPostalCode: z.string().trim().min(3).max(20).optional(),
    locationLatitude: z.number().min(-90).max(90).optional(),
    locationLongitude: z.number().min(-180).max(180).optional(),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    totalPlannedHours: z.number().positive().max(1000),
    requirements: z.array(requirementSchema).min(1).max(20),
  })
  .superRefine((value, ctx) => {
    const hasLat = value.locationLatitude !== undefined;
    const hasLng = value.locationLongitude !== undefined;

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'locationLatitude and locationLongitude must be provided together',
        path: hasLat ? ['locationLongitude'] : ['locationLatitude'],
      });
    }

    if (new Date(value.endTime) <= new Date(value.startTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endTime must be after startTime',
        path: ['endTime'],
      });
    }
  });

export type CreateJobShiftInput = z.infer<typeof createJobShiftSchema>;
