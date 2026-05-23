import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api, type HospitalBillingExportRow } from '../../lib/api';

export function HospitalBillingPage() {
  const { data, loading, error } = useAsyncData(() => api.getHospitalBillingSummary(), []);
  const summary = data?.summary;
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'PAID' | ''>('');
  const [rows, setRows] = useState<HospitalBillingExportRow[]>([]);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pendingRows = useMemo(() => rows.filter((row) => row.invoiceStatus === 'PENDING'), [rows]);
  const paidRows = useMemo(() => rows.filter((row) => row.invoiceStatus === 'PAID'), [rows]);

  async function handleLoadExport() {
    setSubmitting(true);
    setFeedback(null);
    try {
      const response = await api.exportHospitalBilling({ status: statusFilter || undefined, format: 'json', limit: 50 });
      setRows(response.rows);
      setFeedback({ tone: 'success', message: 'Billing export geladen.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Billing export fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Billing Operations"
        description="Operativer Zugriff auf Gebührenübersicht und Rechnungsdaten für Hospital-Administratoren. Fokus auf Zahlungsdruck, Nachverfolgung und Vertragsbezug."
      />
      <AsyncState loading={loading} error={error} isEmpty={!summary} emptyMessage="Noch keine Billing Summary verfügbar.">
        {summary ? (
          <MetricList
            items={[
              { label: 'Signed Contracts', value: summary.signedContracts },
              { label: 'Invoices', value: summary.invoiceCount },
              { label: 'Total Amount', value: `${summary.totalInvoiceAmount} €` },
              { label: 'Pending Amount', value: `${summary.pendingInvoiceAmount} €` },
            ]}
          />
        ) : null}
      </AsyncState>

      <SectionCard title="Billing Fokus" description="Zuerst operative Spannung, dann Detailarbeit im Export.">
        <MetricList
          items={[
            { label: 'Pending Rows', value: pendingRows.length },
            { label: 'Paid Rows', value: paidRows.length },
            { label: 'Offene Gebühren', value: summary ? `${summary.pendingInvoiceAmount} €` : '—' },
            { label: 'Bereits bezahlt', value: summary ? `${summary.paidInvoiceAmount} €` : '—' },
          ]}
        />
        <ol className="ordered-list compact-ordered-list">
          <li>Pending Invoices zuerst prüfen</li>
          <li>Bei Unklarheit direkt in den verknüpften Contract springen</li>
          <li>Nur danach bezahlte Historie kontrollieren</li>
        </ol>
      </SectionCard>

      <SectionCard title="Billing Export" description="Lädt die aktuellen Rechnungszeilen aus dem echten Export-Endpoint als Arbeitsansicht.">
        <div className="form-grid two">
          <Field label="Statusfilter">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'PENDING' | 'PAID' | '')}>
              <option value="">Alle</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
            </select>
          </Field>
        </div>
        <ActionBar>
          <button type="button" disabled={submitting} onClick={() => void handleLoadExport()}>{submitting ? 'Lädt…' : 'Export laden'}</button>
        </ActionBar>
        {feedback ? <FeedbackMessage tone={feedback.tone} message={feedback.message} /> : null}
        <div className="record-list compact-list">
          {rows.map((row) => (
            <div className="panel subpanel" key={row.invoiceId}>
              <div className="section-heading-row">
                <strong>{row.jobShiftTitle || 'Pflegeeinsatz'}</strong>
                <StatusBadge value={row.invoiceStatus} />
              </div>
              <p>{row.nurseDisplayName} · {row.nursePublicId}</p>
              <p>{row.locationCity || 'ohne Ort'} · {row.invoiceAmount} €</p>
              <p>Contract: {row.matchContractId}</p>
              <p>{row.invoiceStatus === 'PENDING' ? 'Operativ offen — Contract-Kontext prüfen.' : 'Bezahlt — primär Historie / Nachweis.'}</p>
              <ActionBar>
                <Link to={`/hospital/contracts?contractId=${encodeURIComponent(row.matchContractId)}`}>Contract öffnen</Link>
              </ActionBar>
            </div>
          ))}
          {rows.length === 0 ? <p className="hint">Noch kein Export geladen.</p> : null}
        </div>
      </SectionCard>
    </section>
  );
}
