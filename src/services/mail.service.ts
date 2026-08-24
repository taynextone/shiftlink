import { logger } from '../config/logger';

/**
 * E-Mail-Versand mit Dev-Fallback.
 *
 * In Produktion: SMTP via env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 * MAIL_FROM). Ohne SMTP-Konfiguration wird die Mail nur geloggt — so bleibt
 * der Flow in Dev/Test vollständig lauffähig, ohne echte Mails zu senden.
 */

export type ContractMailInput = {
  toEmail: string;
  nurseName: string;
  clinicName: string;
  shiftTitle: string | null;
  downloadPath: string;
};

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

export async function sendContractFullyExecutedMail(input: ContractMailInput): Promise<{ sent: boolean; mode: 'smtp' | 'log' }> {
  const subject = `Dein Arbeitsvertrag für den Einsatz bei ${input.clinicName} ist fertig`;
  const body = [
    `Hallo ${input.nurseName},`,
    '',
    `dein Arbeitsvertrag für den Einsatz „${input.shiftTitle ?? 'Einsatz'}" bei ${input.clinicName} ist von beiden Seiten signiert.`,
    'Du kannst das PDF inklusive Personalabteilungs-Anlage jederzeit in ShiftLink herunterladen:',
    input.downloadPath,
    '',
    'Viel Erfolg bei dem Einsatz!',
    'Dein ShiftLink-Team',
  ].join('\n');

  if (!isSmtpConfigured()) {
    // Dev-Fallback: nur loggen
    logger.info({ mode: 'log', to: input.toEmail, subject }, '[mail:dev-fallback] contract fully-executed mail');
    return { sent: false, mode: 'log' };
  }

  // Produktion: nodemailer (lazy geladen, damit Dev ohne Abhängigkeit läuft)
  try {
    const nodemailer = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });

    await transport.sendMail({
      from: process.env.MAIL_FROM ?? 'ShiftLink <no-reply@shiftlink.dev>',
      to: input.toEmail,
      subject,
      text: body,
    });

    return { sent: true, mode: 'smtp' };
  } catch (err) {
    logger.error({ err }, 'SMTP send failed for contract mail');
    return { sent: false, mode: 'smtp' };
  }
}
