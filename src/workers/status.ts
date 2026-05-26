import { whatsappQueue } from '../config/queues';

export async function getQueueStatus() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    whatsappQueue.getWaitingCount(),
    whatsappQueue.getActiveCount(),
    whatsappQueue.getCompletedCount(),
    whatsappQueue.getFailedCount(),
    whatsappQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}
