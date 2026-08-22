import { UserRole } from '@prisma/client';
import { z } from 'zod';

const e164Regex = /^\+[1-9]\d{7,14}$/;

const nurseProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  displayName: z.string().trim().min(2).max(80).optional(),
  // Shiftlink is a matching platform only — hospitals pay nurses directly.
  // No bank details at registration; payout data belongs to the contract flow.
  minHourlyRate: z.number().positive().min(1).optional(),
  // Phone/WhatsApp is collected during onboarding, not mandatory at registration.
  phoneNumber: z.string().trim().regex(e164Regex, 'phoneNumber must be in E.164 format').optional(),
  whatsappOptIn: z.boolean().default(false),
  examenFileUrl: z.string().trim().min(1).optional(),
});

const hospitalProfileSchema = z.object({
  clinicName: z.string().trim().min(1).max(255),
  billingAddress: z.string().trim().min(1).max(500),
  taxNumber: z.string().trim().min(1).max(100),
});

export const registerSchema = z
  .object({
    email: z.email().transform((value) => value.toLowerCase()),
    password: z.string().min(12).max(128),
    role: z.enum([UserRole.NURSE, UserRole.HOSPITAL_ADMIN]),
    nurseProfile: nurseProfileSchema.optional(),
    hospitalProfile: hospitalProfileSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === UserRole.NURSE && !value.nurseProfile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nurseProfile'],
        message: 'nurseProfile is required for NURSE role',
      });
    }

    if (value.role === UserRole.HOSPITAL_ADMIN && !value.hospitalProfile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hospitalProfile'],
        message: 'hospitalProfile is required for HOSPITAL_ADMIN role',
      });
    }
  });

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
