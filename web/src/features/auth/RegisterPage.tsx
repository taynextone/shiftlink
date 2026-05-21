import { useState } from 'react';
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
      setStatus('Registrierung erfolgreich. Nächster Schritt ist Verifikation und Freigabe.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
    }
  }

  return (
    <section className="panel narrow">
      <h1>Registrierung Pflegekraft</h1>
      <form className="stack" onSubmit={handleSubmit}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
        <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display Name" />
        <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Vorname" />
        <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nachname" />
        <button type="submit">Registrieren</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}
    </section>
  );
}
