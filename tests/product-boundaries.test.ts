import { updateNurseProfileSchema } from '../src/schemas/nurse-profile.schema';

describe('Shiftlink platform product boundaries', () => {
  it('does not accept bank details in the platform nurse profile', () => {
    const parsed = updateNurseProfileSchema.parse({
      displayName: 'Nurse Nova',
      iban: 'DE89370400440532013000',
      phoneNumber: '+4915112345678',
      whatsappOptIn: true,
    });

    expect(parsed).not.toHaveProperty('iban');
    expect(parsed.phoneNumber).toBe('+4915112345678');
    expect(parsed.whatsappOptIn).toBe(true);
  });
});
