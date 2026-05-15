import { Queue } from 'bullmq';
import { redis } from './redis';

export const billingQueue = new Queue('billing', {
  connection: redis,
});

export const whatsappQueue = new Queue('whatsapp', {
  connection: redis,
});
