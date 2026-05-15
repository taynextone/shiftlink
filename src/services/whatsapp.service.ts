export type WhatsappTemplatePayload = {
  type: 'new-match-offer' | 'match-signed' | 'match-declined';
  phoneNumber: string;
  matchContractId: string;
  publicId?: string;
  displayName?: string;
  jobShiftId?: string;
  clinicName?: string;
  locationCity?: string | null;
  startTime?: Date;
  endTime?: Date;
};

export async function sendWhatsappTemplateNotification(payload: WhatsappTemplatePayload): Promise<void> {
  console.log('[whatsapp] queued notification', {
    ...payload,
    startTime: payload.startTime?.toISOString?.(),
    endTime: payload.endTime?.toISOString?.(),
  });
}
