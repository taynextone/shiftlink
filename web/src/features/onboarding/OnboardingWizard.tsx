import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { FormSection } from '../../components/FormSection';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { api } from '../../lib/api';

type OnboardingStep = 'profile' | 'preferences' | 'complete';

export function OnboardingWizard() {
  const [step, setStep] = useState<OnboardingStep>('profile');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  // Nurse-specific
  const [minHourlyRate, setMinHourlyRate] = useState('45');
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Hospital-specific
  const [clinicName, setClinicName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateProfile(): boolean {
    const newErrors: Record<string, string> = {};
    if (!displayName.trim()) newErrors.displayName = 'Anzeigename ist erforderlich';
    if (!phoneNumber.trim()) newErrors.phoneNumber = 'Telefonnummer ist erforderlich';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleComplete() {
    if (!validateProfile()) return;

    setSubmitting(true);
    setStatus(null);
    try {
      await api.completeOnboarding({
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim(),
        whatsappOptIn,
        minHourlyRate: minHourlyRate ? Number(minHourlyRate) : undefined,
        specializations,
        clinicName: clinicName.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
      });
      setStep('complete');
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Onboarding fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'complete') {
    const isNurse = !clinicName.trim();
    return (
      <section className="stack page-stack">
        <PageHeader
          eyebrow="Onboarding"
          title="Profil vollständig 🎉"
          description={isNurse ? "Dein Profil ist angelegt. Nächster Schritt: Verifikation." : "Dein Klinikprofil ist bereit."}
        />

        {/* MOS ecosystem context */}
        <div className="panel" style={{ border: "1px solid #f2b04a", background: "#fffaf0", padding: "1rem" }}>
          <strong>Ein Account für alles — MOS</strong>
          <p style={{ margin: "6px 0" }}>
            {isNurse
              ? "Dein Account gilt auch für QualiPass (Zertifikate & Nachweise) und MedBenefit (Exklusiv-Deals). Dein QualiPass ist die Eintrittskarte: Nach erfolgreicher Verifikation werden deine Einsätze freigeschaltet."
              : "Dein Account gilt auch für QualiPass und MedBenefit. Verifizierte Pflegekräfte erkennst du im Matching an ihrem QualiPass-Status."}
          </p>
        </div>

        {isNurse ? (
          <SectionCard title="Was kommt als Nächstes?">
            <ul className="ordered-list">
              <li>Lade deine Verifikationsdokumente hoch (Examen, Arbeitsmedizinischer Nachweis)</li>
              <li>Nach Prüfung durch den Admin wirst du für Matching freigegeben</li>
              <li>Dann siehst du passende Einsätze auf einen Blick</li>
            </ul>
            <ActionBar>
              <a href="/nurse/profile"><button type="button">Zur Verifikation</button></a>
              <a href="/nurse"><button type="button" className="secondary">Zur Übersicht</button></a>
            </ActionBar>
          </SectionCard>
        ) : (
          <SectionCard title="Was kommt als Nächstes?">
            <ul className="ordered-list">
              <li>Lege deine erste Schicht an</li>
              <li>Matching schlägt dir verifizierte Pflegekräfte vor</li>
              <li>Sende Angebote und verwalte Verträge direkt in der Plattform</li>
            </ul>
            <ActionBar>
              <a href="/hospital/shifts"><button type="button">Erste Schicht anlegen</button></a>
              <a href="/hospital"><button type="button" className="secondary">Zur Übersicht</button></a>
            </ActionBar>
          </SectionCard>
        )}
      </section>
    );
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Onboarding"
        title="Profil einrichten"
        description="Schritt {step === 'profile' ? '1' : '2'} von 2 — Basisinformationen für dein Konto."
      />

      {step === 'profile' && (
        <form className="panel form-panel stack" onSubmit={(e) => { e.preventDefault(); if (validateProfile()) setStep('preferences'); }}>
          <FormSection title="Basisdaten" description="Diese Informationen sind für die Kommunikation mit anderen Nutzern sichtbar.">
            <div className="form-grid two">
              <Field label="Anzeigename" error={errors.displayName}>
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="z.B. Max Mustermann" />
              </Field>
              <Field label="Telefonnummer" error={errors.phoneNumber}>
                <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="+491701234567" />
              </Field>
            </div>
            <div className="form-grid">
              <label className="checkbox-label">
                <input type="checkbox" checked={whatsappOptIn} onChange={(event) => setWhatsappOptIn(event.target.checked)} />
                <span>WhatsApp-Benachrichtigungen aktivieren (empfohlen)</span>
              </label>
            </div>
          </FormSection>
          <ActionBar>
            <button type="submit" disabled={submitting}>Weiter</button>
          </ActionBar>
        </form>
      )}

      {step === 'preferences' && (
        <form className="panel form-panel stack" onSubmit={(e) => { e.preventDefault(); void handleComplete(); }}>
          <FormSection title="Präferenzen" description="Diese Einstellungen können später geändert werden.">
            <div className="form-grid two">
              <Field label="Mindestlohn (€/h)">
                <input type="number" value={minHourlyRate} onChange={(event) => setMinHourlyRate(event.target.value)} placeholder="45" />
              </Field>
              <Field label="Klinikname">
                <input value={clinicName} onChange={(event) => setClinicName(event.target.value)} placeholder="z.B. Charité Berlin" />
              </Field>
            </div>
            <Field label="Rechnungsadresse">
              <input value={billingAddress} onChange={(event) => setBillingAddress(event.target.value)} placeholder="Straße, PLZ, Ort" />
            </Field>
          </FormSection>
          {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
          <ActionBar>
            <button type="button" className="secondary" onClick={() => setStep('profile')}>Zurück</button>
            <button type="submit" disabled={submitting}>{submitting ? 'Wird gespeichert…' : 'Profil fertigstellen'}</button>
          </ActionBar>
        </form>
      )}
    </section>
  );
}
