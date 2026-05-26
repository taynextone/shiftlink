import { useCallback, useMemo, useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { MetricList } from '../../components/MetricList';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NotificationCenter() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'QUEUED' | 'DELIVERED' | 'FAILED'>('ALL');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const { data, loading, error, reload } = useAsyncData(
    () => api.getHospitalWhatsAppEvents({ status: statusFilter === 'ALL' ? undefined : statusFilter, limit: 50 }),
    [statusFilter],
  );

  const events = data?.events ?? [];

  const metrics = useMemo(() => {
    const total = events.length;
    const delivered = events.filter((e) => e.status === 'DELIVERED').length;
    const failed = events.filter((e) => e.status === 'FAILED').length;
    const queued = events.filter((e) => e.status === 'QUEUED').length;
    return { total, delivered, failed, queued };
  }, [events]);

  const handleRetry = useCallback(async (contractId: string) => {
    setRetryingId(contractId);
    setFeedback(null);
    try {
      await api.retryOfferWhatsapp({ matchContractId: contractId });
      await reload();
      setFeedback({ tone: 'success', message: 'WhatsApp-Kommunikation wurde erneut in die Queue gestellt.' });
    } catch (err) {
      setFeedback({ tone: 'error', message: err instanceof Error ? err.message : 'Retry fehlgeschlagen' });
    } finally {
      setRetryingId(null);
    }
  }, [reload]);

  return (
    <SectionCard
      title="Kommunikations-Status"
      description="Zentrale Übersicht aller WhatsApp-Kommunikation für dieses Krankenhaus."
    >
      <MetricList
        items={[
          { label: 'Gesamt', value: metrics.total },
          { label: 'Zugestellt', value: metrics.delivered },
          { label: 'Fehlgeschlagen', value: metrics.failed },
          { label: 'In Queue', value: metrics.queued },
        ]}
      />
      <div className="form-grid two" style={{ marginTop: '0.75rem' }}>
        <label>
          <span>Statusfilter</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'QUEUED' | 'DELIVERED' | 'FAILED')}>
            <option value="ALL">Alle</option>
            <option value="QUEUED">In Queue</option>
            <option value="DELIVERED">Zugestellt</option>
            <option value="FAILED">Fehlgeschlagen</option>
          </select>
        </label>
      </div>
      {feedback ? <FeedbackMessage tone={feedback.tone} message={feedback.message} /> : null}
      <div className="record-list compact-list" style={{ marginTop: '0.75rem' }}>
        {loading ? <p className="hint">Wird geladen…</p> : null}
        {error ? <p className="hint">Fehler beim Laden: {error}</p> : null}
        {events.length === 0 && !loading ? <p className="hint">Keine Kommunikationsereignisse gefunden.</p> : null}
        {events.map((event) => (
          <div className="panel subpanel" key={event.id}>
            <div className="section-heading-row">
              <strong>{event.nurseDisplayName} · {event.jobShiftTitle ?? 'Pflegeeinsatz'}</strong>
              <StatusBadge value={event.status} />
            </div>
            <p>Event: {event.eventType} · Telefon: {event.phoneNumber}</p>
            <p>Versuche: {event.attemptCount}</p>
            {event.deliveredAt ? <p>Zugestellt: {new Date(event.deliveredAt).toLocaleString('de-DE')}</p> : null}
            {event.lastError ? <p>Fehler: {event.lastError}</p> : null}
            <p>Erstellt: {new Date(event.createdAt).toLocaleString('de-DE')}</p>
            {event.status === 'FAILED' ? (
              <div className="actions compact" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={retryingId === event.contractId}
                  onClick={() => void handleRetry(event.contractId)}
                >
                  {retryingId === event.contractId ? 'Retry…' : 'Erneut senden'}
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
