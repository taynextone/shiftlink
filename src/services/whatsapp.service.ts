import { env } from '../config/env';
import { prisma } from '../config/prisma';
import logger from '../config/logger';

export type NewMatchOfferWhatsappPayload = {
  type: 'new-match-offer';
  phoneNumber: string;
  matchContractId: string;
  publicId?: string;
  displayName?: string;
  jobShiftId?: string;
  clinicName?: string;
  locationCity?: string | null;
  startTime?: Date;
  endTime?: Date;
  loginUrl?: string;
};

type WhatsappDispatchResult = {
  provider: string;
  accepted: boolean;
  messageText: string;
};

function formatDateTime(value?: Date): string | null {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Berlin',
  }).format(value);
}

export function buildNewMatchOfferWhatsappMessage(payload: NewMatchOfferWhatsappPayload): string {
  const parts = [
    `Hallo${payload.displayName ? ` ${payload.displayName}` : ''},`,
    'du hast ein neues Einsatzangebot auf Shiftlink.',
  ];

  if (payload.clinicName) {
    parts.push(`Klinik: ${payload.clinicName}`);
  }

  if (payload.locationCity) {
    parts.push(`Ort: ${payload.locationCity}`);
  }

  const start = formatDateTime(payload.startTime);
  const end = formatDateTime(payload.endTime);
  if (start && end) {
    parts.push(`Zeitraum: ${start} bis ${end}`);
  }

  if (payload.loginUrl) {
    parts.push(`Zum Angebot: ${payload.loginUrl}`);
  }

  return parts.join('\n');
}

async function dispatchWhatsappMessage(phoneNumber: string, messageText: string): Promise<WhatsappDispatchResult> {
  const provider = env.WHATSAPP_PROVIDER;

  if (provider === 'mock') {
    logger.info({ phoneNumber, messageText }, '[whatsapp:mock] send');
    return {
      provider,
      accepted: true,
      messageText,
    };
  }

  if (provider === 'twilio') {
    logger.info({ phoneNumber, from: env.WHATSAPP_FROM_NUMBER, messageText }, '[whatsapp:twilio-adapter] prepared send');

    return {
      provider,
      accepted: true,
      messageText,
    };
  }

  throw new Error(`Unsupported WhatsApp provider: ${provider}`);
}

export async function sendNewMatchOfferWhatsapp(payload: NewMatchOfferWhatsappPayload): Promise<WhatsappDispatchResult> {
  const messageText = buildNewMatchOfferWhatsappMessage(payload);

  const event = await prisma.whatsAppEvent.create({
    data: {
      matchContractId: payload.matchContractId,
      eventType: payload.type,
      phoneNumber: payload.phoneNumber,
      messageText,
      status: 'QUEUED',
    },
  });

  try {
    const result = await dispatchWhatsappMessage(payload.phoneNumber, messageText);

    await prisma.whatsAppEvent.update({
      where: { id: event.id },
      data: {
        status: result.accepted ? 'DELIVERED' : 'FAILED',
        deliveredAt: result.accepted ? new Date() : null,
        attemptCount: { increment: 1 },
        lastError: result.accepted ? null : 'Provider rejected the message',
      },
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await prisma.whatsAppEvent.update({
      where: { id: event.id },
      data: {
        status: 'FAILED',
        attemptCount: { increment: 1 },
        lastError: errorMessage,
      },
    });

    throw error;
  }
}

export async function getHospitalWhatsAppEvents(hospitalProfileId: string, options?: { status?: string; limit?: number }) {
  const where = {
    matchContract: {
      jobShift: {
        hospitalProfileId,
      },
    },
    ...(options?.status ? { status: options.status } : {}),
  };

  const events = await prisma.whatsAppEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    include: {
      matchContract: {
        include: {
          nurseProfile: true,
          jobShift: true,
        },
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    phoneNumber: event.phoneNumber,
    messageText: event.messageText,
    status: event.status,
    attemptCount: event.attemptCount,
    lastError: event.lastError,
    deliveredAt: event.deliveredAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    contractId: event.matchContractId,
    nurseDisplayName: event.matchContract.nurseProfile.displayName,
    jobShiftTitle: event.matchContract.jobShift.title,
  }));
}

export async function getWhatsAppEventsForContract(matchContractId: string) {
  const events = await prisma.whatsAppEvent.findMany({
    where: { matchContractId },
    orderBy: { createdAt: 'desc' },
  });

  return events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    phoneNumber: event.phoneNumber,
    messageText: event.messageText,
    status: event.status,
    attemptCount: event.attemptCount,
    lastError: event.lastError,
    deliveredAt: event.deliveredAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }));
}
