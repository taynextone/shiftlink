import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { sendContractFullyExecutedMail } from '../services/mail.service';

export const mailWorker = new Worker(
  'mail',
  async (job) => {
    if (job.name === 'contract-fully-executed-mail') {
      await sendContractFullyExecutedMail(job.data);
    }
  },
  {
    connection: redis,
  },
);
