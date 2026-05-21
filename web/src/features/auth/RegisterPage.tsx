import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { api } from '../../lib/api';
import { useAuth } from '../../state/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('NurseNova');
  const [firstName, setFirstName] = useState('Nina');
  const [lastName, setLastName] = useState('Care');
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const result = await api.registerNurse({
        email,
        password,
        role: 'NURSE',
        nurseProfile: {
          displayName,
          firstName,
          lastName,
          iban: 'DE89370400440532013000',
          minHourlyRate: 42,
          phoneNumber: '+491701234567',
          whatsappOptIn: true,
        },
      });
      await setAuthenticatedUser(result.user);
      setStatus('Registrierung erfolgreich.');
      navigate('/nurse');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack auth-layout">
      <PageHeader
        eyebrow="Zugang"
        title="Pflegekraft registrieren"
        description="Erster professioneller Eintrittspunkt für neue Pflegekräfte. Das UI bleibt bewusst sachlich und operativ lesbar."
      />
      <form className="panel form-panel narrow stack" onSubmit={handleSubmit}>
        <div className="form-grid two">
          <label>
            <span>Vorname</span>
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Vorname" />
          </label>
          <label>
            <span>Nachname</span>
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nachname" />
          </label>
        </div>
        <label>
          <span>Display Name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display Name" />
        </label>
        <label>
          <span>E-Mail</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
        </label>
        <label>
          <span>Passwort</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Registrieren…' : 'Registrieren'}</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}
    </section>
  );
}
