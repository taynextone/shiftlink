import { useCallback, useMemo, useState } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { MetricList } from '../../components/MetricList';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';
import { buildAuditLogCsv } from './audit-log-export';

const auditActionLabels: Record<string, string> = {
  OFFER_CREATE: 'Angebot erstellt',
  OFFER_ACCEPT: 'Angebot angenommen',
  OFFER_DECLINE: 'Angebot abgelehnt',
  CONTRACT_VOID: 'Vertrag beendet',
  INVOICE_MARK_PAID: 'Rechnung als bezahlt markiert',
  PAYROLL_EXPORT: 'HR-/Payroll-Export',
  WHATSAPP_RETRY: 'WhatsApp erneut versucht',
  WEBHOOK_RETRY: 'Webhook erneut versucht',
  FAILURE_RESOLVE: 'Fehler als behandelt markiert',
  PROFILE_RELEASE: 'Profil freigegeben',
};

export function AuditLogViewer() {
  const [actionFilter, setActionFilter] = useState<string>('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const { data, loading, error, reload } = useAsyncData(
    () => api.getAuditLogs({ action: actionFilter || undefined, limit: 50 }),
    [actionFilter],
  );

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;

  const metrics = useMemo(() => {
    const actions = new Set(logs.map((l) => l.action));
    return {
      total,
      uniqueActions: actions.size,
      latestEvent: logs[0] ? new Date(logs[0].createdAt).toLocaleString('de-DE') : '—',
    };
  }, [logs, total]);

  const handleExport = useCallback(() => {
    const csv = buildAuditLogCsv(logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ tone: 'success', message: 'Audit-Log als CSV exportiert.' });
  }, [logs]);

  return (
    <SectionCard
      title="Audit-Log"
      description={`${total} Einträge gesamt. Sicherheitsrelevante Aktionen werden hier protokolliert.`}
    >
      <MetricList
        items={[
          { label: 'Einträge', value: metrics.total },
          { label: 'Aktionstypen', value: metrics.uniqueActions },
          { label: 'Letztes Ereignis', value: metrics.latestEvent },
        ]}
      />
      <div className="form-grid two" style={{ marginTop: '0.75rem' }}>
        <label>
          <span>Aktion filtern</span>
          <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
            <option value="">Alle</option>
            <option value="OFFER_CREATE">Angebot erstellt</option>
            <option value="OFFER_ACCEPT">Angebot angenommen</option>
            <option value="OFFER_DECLINE">Angebot abgelehnt</option>
            <option value="CONTRACT_VOID">Vertrag beendet</option>
            <option value="INVOICE_MARK_PAID">Rechnung als bezahlt markiert</option>
            <option value="PAYROLL_EXPORT">HR-/Payroll-Export</option>
            <option value="WHATSAPP_RETRY">WhatsApp erneut versucht</option>
            <option value="WEBHOOK_RETRY">Webhook erneut versucht</option>
            <option value="FAILURE_RESOLVE">Fehler behandelt</option>
            <option value="PROFILE_RELEASE">Profil freigegeben</option>
          </select>
        </label>
        <div className="actions" style={{ alignSelf: 'end' }}>
          <button type="button" className="secondary" onClick={() => void reload()}>Aktualisieren</button>
          <button type="button" className="secondary" onClick={handleExport}>CSV-Export</button>
        </div>
      </div>
      {feedback ? <FeedbackMessage tone={feedback.tone} message={feedback.message} /> : null}
      <div className="record-list compact-list" style={{ marginTop: '0.75rem' }}>
        {loading ? <p className="hint">Wird geladen…</p> : null}
        {error ? <p className="hint">Fehler beim Laden: {String(error)}</p> : null}
        {logs.length === 0 && !loading ? <p className="hint">Keine Audit-Einträge gefunden.</p> : null}
        {logs.map((log) => (
          <div className="panel subpanel" key={log.id}>
            <div className="section-heading-row">
              <strong>{auditActionLabels[log.action] ?? log.action}</strong>
              <StatusBadge value={log.actorRole} />
            </div>
            <p>Akteur: {log.actorUserId} ({log.actorRole})</p>
            {log.targetEntityType ? <p>Ziel: {log.targetEntityType} / {log.targetEntityId}</p> : null}
            {log.metadata ? <p>Metadaten: {JSON.stringify(log.metadata)}</p> : null}
            <p>Zeit: {new Date(log.createdAt).toLocaleString('de-DE')}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
