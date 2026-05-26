import { useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { api } from '../../lib/api';

export function WebhookAdminPanel() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await api.updateWebhookConfig({
        webhookUrl: webhookUrl.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
      });
      setStatus({ tone: 'success', message: 'Webhook-Konfiguration gespeichert.' });
      setWebhookSecret('');
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Speichern fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionCard
      title="Webhook-Konfiguration"
      description="Konfiguriere die Webhook-URL und das Secret für dein Krankenhaus. Webhooks werden bei relevanten Events (z.B. neue Offers, Contract-Status-Änderungen) an diese URL gesendet."
    >
      <form className="panel form-panel stack" onSubmit={handleSave}>
        <Field label="Webhook URL" helpText="HTTPS-URL, an die Events gesendet werden.">
          <input
            type="url"
            value={webhookUrl}
            onChange={(event) => setWebhookUrl(event.target.value)}
            placeholder="https://deine-klinik.example/api/webhooks/shiftlink"
          />
        </Field>
        <Field label="Webhook Secret" helpText="Mindestens 16 Zeichen. Wird für die Signatur der Webhook-Payloads verwendet.">
          <input
            type="password"
            value={webhookSecret}
            onChange={(event) => setWebhookSecret(event.target.value)}
            placeholder="Neues Secret eingeben (optional)"
          />
        </Field>
        {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
        <div className="actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Wird gespeichert…' : 'Konfiguration speichern'}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
