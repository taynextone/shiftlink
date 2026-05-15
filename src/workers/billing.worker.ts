import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { createInvoiceForSignedContract } from '../services/billing.service';

export const billingWorker = new Worker(
  'billing',
  async (job) => {
    if (job.name === 'create-invoice') {
      await createInvoiceForSignedContract(job.data.matchContractId);
    }
  },
  {
    connection: redis,
  },
);
