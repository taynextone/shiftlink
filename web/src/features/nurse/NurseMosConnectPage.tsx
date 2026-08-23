import { useState } from 'react';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

/**
 * MOS-Account-Verknüpfung (Stufe 2, siehe docs/MOS-INTEGRATION.md).
 * Einmalig MOS-Zugangsdaten eingeben → es wird nur die mosUserId gespeichert.
 */

type MosStatus = { connected: boolean; mosUserId: number | null };

const QUALIPASS_LABELS: Record<string, string> = {
  VERIFIED: 'Vollständig verifiziert',
  PARTIALLY_VERIFIED: 'Teilweise verifiziert',
  UNVERIFIED: 'Noch nicht verifiziert',
};

export function NurseMosConnectPage() {
  const { data, loading, error, reload } = useAsyncData<MosStatus>(
    () => api.getMosStatus(),
    [],
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [qualipassHint, setQualipassHint] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setQualipassHint(null);
    try {
      const result = await api.connectMosAccount({ email, password });
      setFeedback({ tone: 'success', text: result.message });
      setQualipassHint(result.qualipassStatus ?? null);
      setPassword('');
      await reload();
    } catch (err) {
      setFeedback({ tone: 'error', text: err instanceof Error ? err.message : 'Verbindung fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect() {
    setSubmitting(true);
    try {
      await api.disconnectMosAccount();
      setFeedback({ tone: 'success', text: 'MOS-Verbindung getrennt.' });
      setQualipassHint(null);
      await reload();
    } catch {
      setFeedback({ tone: 'error', text: 'Trennen fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <PageHeader
        eyebrow="MOS Ökosystem"
        title="MOS verbinden"
        description="Verknüpfe deinen ShiftLink-Account mit deinem MOS-Konto — ein Account für QualiPass, MedBenefit und ShiftLink."
      />

      {feedback && <FeedbackMessage tone={feedback.tone} message={feedback.text} />}

      {loading ? (
        <p className="hint">Lade Status…</p>
      ) : error ? (
        <FeedbackMessage tone="error" message="Status konnte nicht geladen werden." />
      ) : data?.connected ? (
        <SectionCard title="Verbindung aktiv">
          <p>
            Dein ShiftLink-Account ist mit deinem MOS-Konto verknüpft{' '}
            <StatusBadge value={`MOS-ID ${data.mosUserId}`} />
          </p>
          {qualipassHint && (
            <p className="hint">QualiPass: {QUALIPASS_LABELS[qualipassHint] ?? qualipassHint}</p>
          )}
          <button type="button" className="btn-secondary" onClick={handleDisconnect} disabled={submitting}>
            Verbindung trennen
          </button>
        </SectionCard>
      ) : (
        <SectionCard title="MOS-Account verknüpfen">
          <p className="hint">
            Gib einmalig die Zugangsdaten deines MOS-Accounts ein. Wir speichern nur die Verknüpfung —
            niemals dein Passwort. Danach gilt dein QualiPass auch hier in ShiftLink.
          </p>
          <form onSubmit={handleConnect}>
            <Field label="MOS E-Mail">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </Field>
            <Field label="MOS Passwort">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Verbinde…' : 'Jetzt verbinden'}
            </button>
          </form>
        </SectionCard>
      )}
    </main>
  );
}
