import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { api } from '../../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.login({ email, password });
      setStatus('Login erfolgreich. Die Session ist jetzt für die produktiven UI-Flows vorhanden.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login fehlgeschlagen');
    }
  }

  return (
    <section className="stack page-stack auth-layout">
      <PageHeader
        eyebrow="Zugang"
        title="Sign in to Shiftlink"
        description="Professioneller Zugangspunkt für Plattformnutzer. Klar, reduziert und ohne generische Template-Ästhetik."
      />
      <form className="panel form-panel narrow stack" onSubmit={handleSubmit}>
        <label>
          <span>E-Mail</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
        </label>
        <label>
          <span>Passwort</span>
          <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
        </label>
        <button type="submit">Einloggen</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}
    </section>
  );
}
