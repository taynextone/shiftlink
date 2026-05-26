import { z } from 'zod';

const requirementSchema = z.object({
  tag: z.string().trim().min(2).max(80).transform((value) => value.toLowerCase()),
  priority: z.enum(['REQUIRED', 'PREFERRED']),
});

const createJobShiftBaseSchema = z.object({
  externalJobShiftId: z.string().trim().min(1).max(120).optional(),
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
});

export const createJobShiftSchema = createJobShiftBaseSchema.superRefine((value, ctx) => {
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

export const importJobShiftSchema = z.object({
  externalJobShiftId: z.string().trim().min(1).max(120),
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
}).superRefine((value, ctx) => {
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

export const listJobShiftsQuerySchema = z.object({
  status: z.enum(['OPEN', 'MATCHED', 'CANCELED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const billingExportQuerySchema = z.object({
  status: z.enum(['PENDING', 'PAID']).optional(),
  format: z.enum(['json', 'csv']).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export type CreateJobShiftInput = z.infer<typeof createJobShiftSchema>;
export type ImportJobShiftInput = z.infer<typeof importJobShiftSchema>;

export const updateWebhookConfigSchema = z.object({
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().min(16).max(255).optional(),
});

export type UpdateWebhookConfigInput = z.infer<typeof updateWebhookConfigSchema>;
export type ListJobShiftsQueryInput = z.infer<typeof listJobShiftsQuerySchema>;
export type BillingExportQueryInput = z.infer<typeof billingExportQuerySchema>;
