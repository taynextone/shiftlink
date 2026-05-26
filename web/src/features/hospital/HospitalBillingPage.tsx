import { Link, useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api, type HospitalBillingExportRow } from '../../lib/api';
import { exportRowsAsCsv } from '../../lib/export';
import { exportPayrollAsCsv } from '../../lib/export';

function getBillingRowIntervention(row: HospitalBillingExportRow) {
  if (row.invoiceStatus === 'PENDING' && row.matchStatus === 'SIGNED') {
    return { label: 'offene Rechnung bei aktivem Vertrag', detail: 'Invoice-Detail laden und Zahlungsnachverfolgung priorisieren.', tone: 'error' as const };
  }
  if (row.invoiceStatus === 'PENDING') {
    return { label: 'offene Rechnung beobachten', detail: 'Contract-Kontext und nächste Billing-Aktion gemeinsam prüfen.', tone: 'warning' as const };
  }
  return { label: 'historischer Nachweis', detail: 'Nur noch Nachweis, PDF und Vertragshistorie kontrollieren.', tone: 'success' as const };
}

export function HospitalBillingPage() {
  const { data, loading, error } = useAsyncData(() => api.getHospitalBillingSummary(), []);
  const summary = data?.summary;
  const [searchParams] = useSearchParams();
  const focusInvoiceId = searchParams.get('invoiceId') ?? '';
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'PAID' | ''>('');
  const [rows, setRows] = useState<HospitalBillingExportRow[]>([]);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  type InvoiceDetail = { id: string; status: string; amount: string; invoicePdfUrl: string | null; createdAt: string; updatedAt: string; contractId: string; contractStatus: string; jobShiftTitle: string | null; jobShiftLocation: string | null; nurseDisplayName: string; nursePublicId: string };
  const [invoiceDetail, setInvoiceDetail] = useState<InvoiceDetail | null>(null);
  const [invoiceFeedback, setInvoiceFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { title: string; message: string; tone: 'danger' | 'warning' | 'neutral'; onConfirm: () => void | Promise<void> }>(null);
  const [payrollExportData, setPayrollExportData] = useState<Array<{ nurseDisplayName: string; nursePublicId: string; contractId: string; jobShiftTitle: string; jobShiftStartDate: string; jobShiftEndDate: string; agreedHours: number; hourlyRate: number; totalAmount: string; invoiceStatus: string; invoiceId: string }>>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const pendingRows = useMemo(() => rows.filter((row) => row.invoiceStatus === 'PENDING'), [rows]);
  const paidRows = useMemo(() => rows.filter((row) => row.invoiceStatus === 'PAID'), [rows]);
  const rowsWithArtifacts = useMemo(() => rows.filter((row) => row.signedAt), [rows]);
  const prioritizedRows = useMemo(
    () => [...rows].sort((left, right) => {
      const leftPending = left.invoiceStatus === 'PENDING' ? 0 : 1;
      const rightPending = right.invoiceStatus === 'PENDING' ? 0 : 1;
      if (leftPending !== rightPending) {
        return leftPending - rightPending;
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }),
    [rows],
  );

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

  const handleSelectInvoice = useCallback(async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setInvoiceFeedback(null);
    try {
      const detail = await api.getInvoiceDetail(invoiceId);
      setInvoiceDetail(detail);
    } catch (error) {
      setInvoiceFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Invoice-Detail konnte nicht geladen werden.' });
    }
  }, []);

  const handleMarkPaid = useCallback(() => {
    if (!invoiceDetail || invoiceDetail.status === 'PAID') return;
    setConfirmAction({
      title: 'Rechnung als bezahlt markieren',
      message: `Rechnung ${invoiceDetail.id} als bezahlt markieren?\n\nBetrag: ${invoiceDetail.amount} €`,
      tone: 'warning',
      onConfirm: async () => {
        setConfirmAction(null);
        setMarkingPaid(true);
        setInvoiceFeedback(null);
        try {
          await api.markInvoicePaid(invoiceDetail.id);
          setInvoiceFeedback({ tone: 'success', message: 'Rechnung wurde als bezahlt markiert.' });
          setInvoiceDetail((prev) => prev ? { ...prev, status: 'PAID' } : prev);
          setRows((prev) => prev.map((row) => row.invoiceId === invoiceDetail.id ? { ...row, invoiceStatus: 'PAID' } : row));
          setFeedback({ tone: 'success', message: `Invoice ${invoiceDetail.id} wurde in der Export-Ansicht auf PAID aktualisiert.` });
        } catch (error) {
          setInvoiceFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Mark-Paid fehlgeschlagen' });
        } finally {
          setMarkingPaid(false);
        }
      },
    });
  }, [invoiceDetail]);

  useEffect(() => {
    if (!focusInvoiceId) return;
    void handleSelectInvoice(focusInvoiceId);
  }, [focusInvoiceId, handleSelectInvoice]);

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
            { label: 'Rows mit Signaturdatum', value: rowsWithArtifacts.length },
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
        <MetricList
          items={[
            { label: 'Geladene Rows', value: rows.length },
            { label: 'Pending im Export', value: pendingRows.length },
            { label: 'Paid im Export', value: paidRows.length },
            { label: 'Filter', value: statusFilter || 'Alle' },
          ]}
        />
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
            {rows.length > 0 ? (
              <button type="button" className="secondary" onClick={() => exportRowsAsCsv(rows, 'billing-export')}>CSV Export</button>
            ) : null}
        </ActionBar>
        {feedback ? <FeedbackMessage tone={feedback.tone} message={feedback.message} /> : null}
        <div className="record-list compact-list">
          {prioritizedRows.map((row) => {
            const intervention = getBillingRowIntervention(row);
            return (
            <div className="panel subpanel" key={row.invoiceId}>
              <div className="section-heading-row">
                <strong>{row.jobShiftTitle || 'Pflegeeinsatz'}</strong>
                <StatusBadge value={row.invoiceStatus} />
              </div>
              <p>{row.nurseDisplayName} · {row.nursePublicId}</p>
              <p>{row.locationCity || 'ohne Ort'} · {row.invoiceAmount} €</p>
              <p>Invoice erstellt: {new Date(row.createdAt).toLocaleString('de-DE')}</p>
              <p>Contract: {row.matchContractId}</p>
              <p>Signed At: {row.signedAt ? new Date(row.signedAt).toLocaleString('de-DE') : '—'}</p>
              <p>Shift Status: {row.matchStatus}</p>
              <p><strong>{intervention.label}</strong></p>
              <p>{intervention.detail}</p>
              <ActionBar>
                <button type="button" className="secondary" onClick={() => void handleSelectInvoice(row.invoiceId)}>{selectedInvoiceId === row.invoiceId ? 'Detail sichtbar' : 'Invoice-Detail'}</button>
                <Link to={`/hospital/contracts?contractId=${encodeURIComponent(row.matchContractId)}`}>Contract öffnen</Link>
              </ActionBar>
            </div>
          );})}
          {rows.length === 0 ? <p className="hint">{statusFilter ? `Kein Billing-Export für Filter ${statusFilter} geladen oder gefunden.` : 'Noch kein Export geladen.'}</p> : null}
        </div>
      </SectionCard>

      {invoiceDetail ? (
        <SectionCard
          title={`Invoice Detail — ${invoiceDetail.id}`}
          description={`Rechnung für ${invoiceDetail.nurseDisplayName} · ${invoiceDetail.jobShiftTitle || 'Pflegeeinsatz'}`}
        >
          <MetricList
            items={[
              { label: 'Status', value: invoiceDetail.status },
              { label: 'Betrag', value: `${invoiceDetail.amount} €` },
              { label: 'Contract', value: invoiceDetail.contractStatus },
              { label: 'Erstellt', value: new Date(invoiceDetail.createdAt).toLocaleString('de-DE') },
              { label: 'Pflegekraft', value: `${invoiceDetail.nurseDisplayName} (${invoiceDetail.nursePublicId})` },
              { label: 'Ort', value: invoiceDetail.jobShiftLocation || '—' },
            ]}
          />
          {invoiceFeedback ? <FeedbackMessage tone={invoiceFeedback.tone} message={invoiceFeedback.message} /> : null}
          <ActionBar>
            {invoiceDetail.status !== 'PAID' ? (
              <button type="button" disabled={markingPaid} onClick={() => void handleMarkPaid()}>
                {markingPaid ? '…' : 'Als bezahlt markieren'}
              </button>
            ) : (
              <span className="hint">Diese Rechnung ist bereits bezahlt.</span>
            )}
            <Link to={`/hospital/contracts?contractId=${encodeURIComponent(invoiceDetail.contractId)}`}>
              <button type="button" className="secondary">Contract öffnen</button>
            </Link>
            <button type="button" className="secondary" onClick={() => { setSelectedInvoiceId(null); setInvoiceDetail(null); setInvoiceFeedback(null); }}>Schließen</button>
          </ActionBar>
        </SectionCard>
      ) : null}
      {confirmAction ? (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Bestätigen"
          cancelLabel="Abbrechen"
          tone={confirmAction.tone}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}
    </section>
  );
}
