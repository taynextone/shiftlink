import { prisma } from '../config/prisma';

export async function getBusinessMetrics() {
  const [
    totalNurses,
    totalHospitals,
    totalShifts,
    totalContracts,
    signedContracts,
    pendingContracts,
    declinedContracts,
    expiredContracts,
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    totalWhatsappEvents,
    deliveredWhatsappEvents,
    failedWhatsappEvents,
  ] = await Promise.all([
    prisma.nurseProfile.count(),
    prisma.hospitalProfile.count(),
    prisma.jobShift.count(),
    prisma.matchContract.count(),
    prisma.matchContract.count({ where: { status: 'SIGNED' } }),
    prisma.matchContract.count({ where: { status: 'PENDING' } }),
    prisma.matchContract.count({ where: { status: 'DECLINED' } }),
    prisma.matchContract.count({ where: { status: 'EXPIRED' } }),
    prisma.invoice.count(),
    prisma.invoice.count({ where: { status: 'PAID' } }),
    prisma.invoice.count({ where: { status: 'PENDING' } }),
    prisma.whatsAppEvent.count(),
    prisma.whatsAppEvent.count({ where: { status: 'DELIVERED' } }),
    prisma.whatsAppEvent.count({ where: { status: 'FAILED' } }),
  ]);

  const offerConversionRate = totalContracts > 0
    ? Math.round((signedContracts / totalContracts) * 100)
    : 0;

  const invoicePaymentRate = totalInvoices > 0
    ? Math.round((paidInvoices / totalInvoices) * 100)
    : 0;

  const whatsappDeliveryRate = totalWhatsappEvents > 0
    ? Math.round((deliveredWhatsappEvents / totalWhatsappEvents) * 100)
    : 0;

  return {
    users: {
      totalNurses,
      totalHospitals,
    },
    shifts: {
      total: totalShifts,
    },
    contracts: {
      total: totalContracts,
      signed: signedContracts,
      pending: pendingContracts,
      declined: declinedContracts,
      expired: expiredContracts,
      conversionRate: offerConversionRate,
    },
    invoices: {
      total: totalInvoices,
      paid: paidInvoices,
      pending: pendingInvoices,
      paymentRate: invoicePaymentRate,
    },
    notifications: {
      total: totalWhatsappEvents,
      delivered: deliveredWhatsappEvents,
      failed: failedWhatsappEvents,
      deliveryRate: whatsappDeliveryRate,
    },
  };
}
