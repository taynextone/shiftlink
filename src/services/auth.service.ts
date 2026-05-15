import createHttpError from 'http-errors';
import { Prisma, UserRole } from '@prisma/client';
import argon2 from 'argon2';
import { prisma } from '../config/prisma';
import { RegisterInput } from '../schemas/auth.schema';

export type RegisteredUser = Awaited<ReturnType<typeof registerUser>>;

export async function registerUser(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw createHttpError(409, 'Email is already registered');
  }

  const passwordHash = await argon2.hash(input.password);

  const data: Prisma.UserCreateInput = {
    email: input.email,
    passwordHash,
    role: input.role,
    nurseProfile:
      input.role === UserRole.NURSE && input.nurseProfile
        ? {
            create: {
              firstName: input.nurseProfile.firstName,
              lastName: input.nurseProfile.lastName,
              iban: input.nurseProfile.iban,
              minHourlyRate: new Prisma.Decimal(input.nurseProfile.minHourlyRate),
              phoneNumber: input.nurseProfile.phoneNumber,
              whatsappOptIn: input.nurseProfile.whatsappOptIn,
              examenFileUrl: input.nurseProfile.examenFileUrl,
            },
          }
        : undefined,
    hospitalProfile:
      input.role === UserRole.HOSPITAL_ADMIN && input.hospitalProfile
        ? {
            create: {
              clinicName: input.hospitalProfile.clinicName,
              billingAddress: input.hospitalProfile.billingAddress,
              taxNumber: input.hospitalProfile.taxNumber,
            },
          }
        : undefined,
  };

  return prisma.user.create({
    data,
    include: {
      nurseProfile: true,
      hospitalProfile: true,
    },
  });
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      nurseProfile: true,
      hospitalProfile: true,
    },
  });

  if (!user) {
    throw createHttpError(401, 'Invalid email or password');
  }

  const isPasswordValid = await argon2.verify(user.passwordHash, password);

  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid email or password');
  }

  return user;
}
