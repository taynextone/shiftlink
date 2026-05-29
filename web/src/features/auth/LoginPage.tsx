import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { PageHeader } from '../../components/PageHeader';
import { api } from '../../lib/api';
import { useAuth } from '../../state/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'NURSE' | 'HOSPITAL_ADMIN' | null>(null);

  const errors = useMemo(() => ({
    email: email && !email.includes('@') ? 'Ungültige E-Mail-Adresse' : null,
    password: password && password.length < 8 ? 'Mindestens 8 Zeichen erforderlich' : null,
  }), [email, password]);

  const canSubmit = email.length > 0 && password.length > 0 && !errors.email && !errors.password;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({ tone: 'error', message: 'Bitte Eingaben korrigieren, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const result = await api.login({ email, password });
      await setAuthenticatedUser(result.user);
      setStatus({ tone: 'success', message: 'Login erfolgreich.' });
      navigate(result.user.role === 'HOSPITAL_ADMIN' ? '/hospital' : '/nurse');
    } catch (error) {
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Login fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(role: 'NURSE' | 'HOSPITAL_ADMIN') {
    setDemoLoading(role);
    setStatus(null);
    try {
      const result = await api.demoLogin(role);
      await setAuthenticatedUser(result.user);
      setStatus({ tone: 'success', message: `Demo-Login als ${role === 'NURSE' ? 'Pflegekraft' : 'Krankenhaus'} erfolgreich.` });
      navigate(role === 'HOSPITAL_ADMIN' ? '/hospital' : '/nurse');
    } catch (error) {
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Demo-Login fehlgeschlagen' });
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <section className="stack page-stack auth-layout auth-grid">
      <div className="stack">
        <PageHeader
          eyebrow="Zugang"
          title="Sign in to Shiftlink"
          description="Professioneller Zugangspunkt für Plattformnutzer. Klar, reduziert und ohne generische Template-Ästhetik."
        />
        <form className="panel form-panel narrow stack" onSubmit={handleSubmit}>
          <Field label="E-Mail" helpText="Nutze die E-Mail deines bestehenden Plattformkontos." error={errors.email}>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
          </Field>
          <Field label="Passwort" helpText="Mindestens 8 Zeichen." error={errors.password}>
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
          </Field>
          <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Einloggen…' : 'Einloggen'}</button>
        </form>
        <div className="panel form-panel narrow stack">
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Schnellzugang ohne Registrierung:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary"
              onClick={() => handleDemoLogin('NURSE')}
              disabled={demoLoading !== null}
            >
              {demoLoading === 'NURSE' ? 'Lädt…' : 'Demo: Pflegekraft'}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => handleDemoLogin('HOSPITAL_ADMIN')}
              disabled={demoLoading !== null}
            >
              {demoLoading === 'HOSPITAL_ADMIN' ? 'Lädt…' : 'Demo: Krankenhaus'}
            </button>
          </div>
        </div>
        {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
      </div>
      <EmptyState
        title="Zugangslogik"
        description="Login schützt role-aware Produktbereiche. Nach erfolgreicher Authentifizierung führt Shiftlink Nutzer direkt in ihren operativen Arbeitskontext."
      />
    </section>
  );
}
