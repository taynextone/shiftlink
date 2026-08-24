import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

type MosStatus = { connected: boolean; mosUserId: number | null; qualipassStatus?: string | null };

const QUALIPASS_LABELS: Record<string, string> = {
  VERIFIED: 'Vollständig verifiziert',
  PARTIALLY_VERIFIED: 'Teilweise verifiziert',
  UNVERIFIED: 'Noch nicht verifiziert',
};

export function NurseMosConnectPage() {
  const [searchParams] = useSearchParams();
  const justConnected = searchParams.get('connected') === '1';
  const { data, loading, error, reload } = useAsyncData<MosStatus>(
    () => api.getMosStatus(),
    [],
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [qualipassHint, setQualipassHint] = useState<string | null>(null);

  useEffect(() => {
    if (justConnected) {
      setFeedback({ tone: 'success', text: 'MOS-Account erfolgreich über SSO verknüpft.' });
    }
    if (data?.connected && data.qualipassStatus) {
      setQualipassHint(data.qualipassStatus);
    }
  }, [justConnected, data]);

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
        title="QualiPass"
        description="Dein Verifikationsstatus aus MOS wirkt sich automatisch aus. Du musst hier nichts tun."
      />

      {feedback && <FeedbackMessage tone={feedback.tone} message={feedback.text} />}

      {loading ? (
        <p className="hint">Lade Status…</p>
      ) : error ? (
        <FeedbackMessage tone="error" message="Status konnte nicht geladen werden." />
      ) : (
        <SectionCard title="Es funktioniert von allein">
          <p>
            <strong>Du brauchst nichts zu verknüpfen.</strong><br />
            Sobald du einen Account im MOS-Ökosystem hast (auch Demo-Accounts), wird dein QualiPass-Status automatisch bei der Kandidatensuche von Krankenhäusern berücksichtigt.
          </p>
          <p>
            Verifizierte Profile werden priorisiert angezeigt — ohne dass du hier irgendetwas klicken oder eingeben musst.
          </p>

          {data?.connected ? (
            <div style={{ marginTop: "1rem" }}>
              <p>Dein Account ist aktuell mit MOS verknüpft (ID {data.mosUserId}).</p>
              <button type="button" className="btn-secondary" onClick={handleDisconnect} disabled={submitting}>
                Verknüpfung trennen (nur falls du das wirklich willst)
              </button>
            </div>
          ) : (
            <p className="hint" style={{ marginTop: "1rem" }}>
              Die Verknüpfung unten ist komplett optional und nur für Leute mit einem eigenen MOS-Account relevant.
            </p>
          )}

          {!data?.connected && (
            <details style={{ marginTop: "1rem" }}>
              <summary>Optional: MOS-Account verknüpfen (nicht nötig)</summary>
              <div style={{ marginTop: "0.75rem" }}>
                <a className="btn-primary" href="/api/v1/auth/mos/sso/start">Mit MOS anmelden (SSO)</a>
                <p className="hint">Wird zu MOS weitergeleitet — du gibst hier keine Daten ein.</p>
              </div>
            </details>
          )}
        </SectionCard>
      )}
    </main>
  );

}
