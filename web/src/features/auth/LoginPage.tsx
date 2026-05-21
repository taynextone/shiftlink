import { useState } from 'react';
import { api } from '../../lib/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.login({ email, password });
      setStatus('Login erfolgreich. Du kannst jetzt in die Pflegekraft-Flows wechseln.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login fehlgeschlagen');
    }
  }

  return (
    <section className="panel narrow">
      <h1>Login</h1>
      <form className="stack" onSubmit={handleSubmit}>
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
        <button type="submit">Einloggen</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}
    </section>
  );
}
