import { env } from '../config/env';

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
    console.log('[whatsapp:mock] send', { phoneNumber, messageText });
    return {
      provider,
      accepted: true,
      messageText,
    };
  }

  if (provider === 'twilio') {
    console.log('[whatsapp:twilio-adapter] prepared send', {
      phoneNumber,
      from: env.WHATSAPP_FROM_NUMBER,
      messageText,
    });

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
  return dispatchWhatsappMessage(payload.phoneNumber, messageText);
}
