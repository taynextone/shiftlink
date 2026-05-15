import { UserRole } from '@prisma/client';
import { z } from 'zod';

const e164Regex = /^\+[1-9]\d{7,14}$/;

const nurseProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  iban: z.string().trim().min(15).max(34),
  minHourlyRate: z.number().positive().min(1).default(42),
  phoneNumber: z.string().trim().regex(e164Regex, 'phoneNumber must be in E.164 format'),
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
