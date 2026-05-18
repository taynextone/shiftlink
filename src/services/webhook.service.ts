import { prisma } from '../config/prisma';

export async function createHospitalWebhookEvent(input: {
  hospitalProfileId: string;
  eventType: string;
  payload: unknown;
}) {
  return prisma.webhookEvent.create({
    data: {
      hospitalProfileId: input.hospitalProfileId,
      eventType: input.eventType,
      payloadJson: JSON.stringify(input.payload),
    },
  });
}
