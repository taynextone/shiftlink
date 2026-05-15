export type WhatsappTemplatePayload = {
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

export async function sendWhatsappTemplateNotification(payload: WhatsappTemplatePayload): Promise<void> {
  console.log('[whatsapp] queued offer notification', {
    ...payload,
    startTime: payload.startTime?.toISOString?.(),
    endTime: payload.endTime?.toISOString?.(),
  });
}
