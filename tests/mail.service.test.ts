import { sendContractFullyExecutedMail, isSmtpConfigured } from '../src/services/mail.service';

// redis mocken (medbenefit) bzw. env setzen
describe('mail.service', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.MAIL_FROM;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('isSmtpConfigured', () => {
    it('returns false without SMTP env', () => {
      expect(isSmtpConfigured()).toBe(false);
    });

    it('returns true when host and port are set', () => {
      process.env.SMTP_HOST = 'smtp.test.dev';
      process.env.SMTP_PORT = '587';
      expect(isSmtpConfigured()).toBe(true);
    });
  });

  describe('sendContractFullyExecutedMail', () => {
    const baseInput = {
      toEmail: 'nurse@example.dev',
      nurseName: 'Anna Müller',
      clinicName: 'St. Maria Krankenhaus',
      shiftTitle: 'Nachtschicht Station 3B',
      downloadPath: '/nurse/contracts',
    };

    it('falls back to log mode without SMTP config (dev fallback)', async () => {
      const result = await sendContractFullyExecutedMail(baseInput);
      expect(result.mode).toBe('log');
      expect(result.sent).toBe(false);
    });

    it('attempts SMTP when configured and reports failure on bad transport', async () => {
      process.env.SMTP_HOST = '127.0.0.1';
      process.env.SMTP_PORT = '1'; // nothing listens here
      const result = await sendContractFullyExecutedMail({ ...baseInput });
      // Transport-Fehler wird geschluckt und als nicht gesendet gemeldet
      expect(result.sent).toBe(false);
      expect(result.mode).toBe('smtp');
    });
  });
});
