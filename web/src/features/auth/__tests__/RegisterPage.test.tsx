import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegisterPage } from '../RegisterPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  register: vi.fn(),
  setAuthenticatedSession: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('../../../lib/api', () => ({
  api: {
    register: mocks.register,
  },
}));

vi.mock('../../../state/AuthContext', () => ({
  useAuth: () => ({
    setAuthenticatedSession: mocks.setAuthenticatedSession,
  }),
}));

function renderRegisterPage() {
  return render(<RegisterPage />);
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.register.mockReset();
    mocks.setAuthenticatedSession.mockReset();
  });

  it('submits a hospital registration and redirects to the hospital workspace', async () => {
    const auth = {
      cookieName: 'shiftlink.sid',
      user: {
        id: 'user-hospital',
        email: 'ops@charite.test',
        role: 'HOSPITAL_ADMIN',
      },
    };
    mocks.register.mockResolvedValueOnce({ auth });

    renderRegisterPage();

    await userEvent.click(screen.getByRole('button', { name: /krankenhaus/i }));
    await userEvent.type(screen.getByPlaceholderText('Klinik oder Träger'), 'Charite Campus Mitte');
    await userEvent.type(screen.getByPlaceholderText('Straße, PLZ, Ort'), 'Chariteplatz 1, 10117 Berlin');
    await userEvent.type(screen.getByPlaceholderText('DE123456789'), 'DE123456789');
    await userEvent.type(screen.getByPlaceholderText('E-Mail'), 'ops@charite.test');
    await userEvent.type(screen.getByPlaceholderText('Passwort'), 'HospitalPass1!');
    await userEvent.click(screen.getByRole('button', { name: 'Registrieren' }));

    await waitFor(() => expect(mocks.register).toHaveBeenCalledTimes(1));
    expect(mocks.register).toHaveBeenCalledWith({
      email: 'ops@charite.test',
      password: 'HospitalPass1!',
      role: 'HOSPITAL_ADMIN',
      hospitalProfile: {
        clinicName: 'Charite Campus Mitte',
        billingAddress: 'Chariteplatz 1, 10117 Berlin',
        taxNumber: 'DE123456789',
      },
    });
    expect(mocks.setAuthenticatedSession).toHaveBeenCalledWith(auth);
    expect(mocks.navigate).toHaveBeenCalledWith('/hospital');
  });

  it('keeps nurse registration as the default role', () => {
    renderRegisterPage();

    expect(screen.getByPlaceholderText('Vorname')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nachname')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Klinik oder Träger')).not.toBeInTheDocument();
  });
});
