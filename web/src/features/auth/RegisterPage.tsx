import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { PageHeader } from '../../components/PageHeader';
import { api } from '../../lib/api';
import { useAuth } from '../../state/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => ({
    firstName: !firstName.trim() ? 'Vorname ist erforderlich' : null,
    lastName: !lastName.trim() ? 'Nachname ist erforderlich' : null,
    displayName: !displayName.trim() ? 'Display Name ist erforderlich' : null,
    email: email && !email.includes('@') ? 'Ungültige E-Mail-Adresse' : null,
    password: password && password.length < 8 ? 'Mindestens 8 Zeichen erforderlich' : null,
  }), [displayName, email, firstName, lastName, password]);

  const canSubmit =
    Boolean(firstName.trim()) &&
    Boolean(lastName.trim()) &&
    Boolean(displayName.trim()) &&
    Boolean(email) &&
    Boolean(password) &&
    !errors.email &&
    !errors.password;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({ tone: 'error', message: 'Bitte Eingaben korrigieren, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const result = await api.registerNurse({
        email,
        password,
        role: 'NURSE',
        nurseProfile: {
          displayName: displayName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          iban: 'DE89370400440532013000',
          minHourlyRate: 42,
          phoneNumber: '+491701234567',
          whatsappOptIn: true,
        },
      });
      await setAuthenticatedUser(result.user);
      setStatus({ tone: 'success', message: 'Registrierung erfolgreich.' });
      navigate('/nurse');
    } catch (error) {
      setStatus({ tone: 'error', message: error instanceof Error ? error.message : 'Registrierung fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack auth-layout auth-grid">
      <div className="stack">
        <PageHeader
          eyebrow="Zugang"
          title="Pflegekraft registrieren"
          description="Erster professioneller Eintrittspunkt für neue Pflegekräfte. Das UI bleibt bewusst sachlich und operativ lesbar."
        />
        <form className="panel form-panel narrow stack" onSubmit={handleSubmit}>
          <div className="form-grid two">
            <Field label="Vorname" error={errors.firstName}>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Vorname" />
            </Field>
            <Field label="Nachname" error={errors.lastName}>
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nachname" />
            </Field>
          </div>
          <Field label="Display Name" helpText="So wird dein Profil im Matching sichtbar." error={errors.displayName}>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display Name" />
          </Field>
          <Field label="E-Mail" error={errors.email}>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
          </Field>
          <Field label="Passwort" helpText="Mindestens 8 Zeichen." error={errors.password}>
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
          </Field>
          <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Registrieren…' : 'Registrieren'}</button>
        </form>
        {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
      </div>
      <EmptyState
        title="Registrierungslogik"
        description="Die Registrierung legt das Nurse-Profil an und führt danach direkt in den geschützten Pflegekraft-Bereich. Matching-Freigabe bleibt weiterhin an Verifikation gekoppelt."
      />
    </section>
  );
}
