import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { PageHeader } from '../../components/PageHeader';
import { api } from '../../lib/api';
import { useAuth } from '../../state/AuthContext';

type RegisterRole = 'NURSE' | 'HOSPITAL_ADMIN';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthenticatedSession } = useAuth();
  const [searchParams] = useSearchParams();

  // Support pre-selection from Landing page CTAs (?role=HOSPITAL_ADMIN)
  const initialRole: RegisterRole =
    searchParams.get('role') === 'HOSPITAL_ADMIN' ? 'HOSPITAL_ADMIN' : 'NURSE';

  const [role, setRole] = useState<RegisterRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => ({
    firstName: role === 'NURSE' && !firstName.trim() ? 'Vorname ist erforderlich' : null,
    lastName: role === 'NURSE' && !lastName.trim() ? 'Nachname ist erforderlich' : null,
    displayName: role === 'NURSE' && !displayName.trim() ? 'Display Name ist erforderlich' : null,
    clinicName: role === 'HOSPITAL_ADMIN' && !clinicName.trim() ? 'Krankenhausname ist erforderlich' : null,
    billingAddress: role === 'HOSPITAL_ADMIN' && !billingAddress.trim() ? 'Rechnungsadresse ist erforderlich' : null,
    taxNumber: role === 'HOSPITAL_ADMIN' && !taxNumber.trim() ? 'Steuernummer ist erforderlich' : null,
    email: email && !email.includes('@') ? 'Ungültige E-Mail-Adresse' : null,
    password: password && password.length < 12 ? 'Mindestens 12 Zeichen erforderlich' : null,
  }), [billingAddress, clinicName, displayName, email, firstName, lastName, password, role, taxNumber]);

  const canSubmit =
    Boolean(email.trim()) &&
    Boolean(password) &&
    (role === 'NURSE'
      ? Boolean(firstName.trim()) && Boolean(lastName.trim()) && Boolean(displayName.trim())
      : Boolean(clinicName.trim()) && Boolean(billingAddress.trim()) && Boolean(taxNumber.trim())) &&
    !errors.email &&
    !errors.password &&
    !errors.firstName &&
    !errors.lastName &&
    !errors.displayName &&
    !errors.clinicName &&
    !errors.billingAddress &&
    !errors.taxNumber;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({ tone: 'error', message: 'Bitte Eingaben korrigieren, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const result = await api.register({
        email: email.trim(),
        password,
        role,
        ...(role === 'NURSE'
          ? {
              nurseProfile: {
                displayName: displayName.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                whatsappOptIn: false,
              },
            }
          : {
              hospitalProfile: {
                clinicName: clinicName.trim(),
                billingAddress: billingAddress.trim(),
                taxNumber: taxNumber.trim(),
              },
            }),
      });
      setAuthenticatedSession(result.auth);
      setStatus({ tone: 'success', message: 'Registrierung erfolgreich.' });
      // New accounts go through onboarding first (profile completion + MOS context)
      navigate('/onboarding');
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
          title="Bei Shiftlink registrieren"
          description="Erster professioneller Eintrittspunkt für Pflegekräfte und Krankenhäuser. Nach der Registrierung öffnet Shiftlink direkt den passenden Arbeitsbereich."
        />
        <form className="panel form-panel narrow stack" onSubmit={handleSubmit}>
          <div className="selection-list" role="group" aria-label="Kontotyp">
            <button
              type="button"
              className={role === 'NURSE' ? 'selection-card active' : 'selection-card'}
              aria-pressed={role === 'NURSE'}
              onClick={() => {
                setRole('NURSE');
                setStatus(null);
              }}
            >
              <span>
                <strong>Pflegekraft</strong>
                <p>Eigenes Profil anlegen und nach Verifikation passende Einsätze erhalten.</p>
              </span>
            </button>
            <button
              type="button"
              className={role === 'HOSPITAL_ADMIN' ? 'selection-card active' : 'selection-card'}
              aria-pressed={role === 'HOSPITAL_ADMIN'}
              onClick={() => {
                setRole('HOSPITAL_ADMIN');
                setStatus(null);
              }}
            >
              <span>
                <strong>Krankenhaus</strong>
                <p>Klinikprofil anlegen und kurzfristige Schichten operativ steuern.</p>
              </span>
            </button>
          </div>
          {role === 'NURSE' ? (
            <>
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
            </>
          ) : (
            <>
              <Field label="Krankenhausname" error={errors.clinicName}>
                <input value={clinicName} onChange={(event) => setClinicName(event.target.value)} placeholder="Klinik oder Träger" />
              </Field>
              <Field label="Rechnungsadresse" error={errors.billingAddress}>
                <input value={billingAddress} onChange={(event) => setBillingAddress(event.target.value)} placeholder="Straße, PLZ, Ort" />
              </Field>
              <Field label="Steuernummer" error={errors.taxNumber}>
                <input value={taxNumber} onChange={(event) => setTaxNumber(event.target.value)} placeholder="DE123456789" />
              </Field>
            </>
          )}
          <Field label="E-Mail" error={errors.email}>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-Mail" type="email" />
          </Field>
          <Field label="Passwort" helpText="Mindestens 12 Zeichen." error={errors.password}>
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Passwort" type="password" />
          </Field>
          <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Registrieren...' : 'Registrieren'}</button>
        </form>
        {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
      </div>
      <EmptyState
        title={role === 'NURSE' ? 'Pflegekraft-Registrierung' : 'Krankenhaus-Registrierung'}
        description={role === 'NURSE'
          ? 'Die Registrierung legt das Nurse-Profil an und führt danach direkt in den geschützten Pflegekraft-Bereich. Matching-Freigabe bleibt weiterhin an Verifikation gekoppelt.'
          : 'Die Registrierung legt das Krankenhausprofil an und führt danach direkt in den geschützten Hospital-Bereich für Schichten, Offers und Verträge.'}
      />
    </section>
  );
}
