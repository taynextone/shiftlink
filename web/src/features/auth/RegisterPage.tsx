import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { api } from '../../lib/api';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('NurseNova');
  const [firstName, setFirstName] = useState('Nina');
  const [lastName, setLastName] = useState('Care');
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.registerNurse({
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
      setStatus('Registrierung erfolgreich. Nächster fachlicher Schritt ist Verifikation und Matching-Freigabe.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
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
        <button type="submit">Registrieren</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}
    </section>
  );
}
