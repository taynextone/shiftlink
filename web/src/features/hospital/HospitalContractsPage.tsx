import { useMemo, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api, type ContractLifecycle, type ContractPdfResponse, type ContractSnapshotResponse, type HospitalOffer } from '../../lib/api';

export function HospitalContractsPage() {
  const [jobShiftId, setJobShiftId] = useState('');
  const [contractId, setContractId] = useState('');
  const [voidReason, setVoidReason] = useState('Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.');
  const [lifecycle, setLifecycle] = useState<ContractLifecycle | null>(null);
  const [offers, setOffers] = useState<HospitalOffer[]>([]);
  const [snapshot, setSnapshot] = useState<ContractSnapshotResponse | null>(null);
  const [pdf, setPdf] = useState<ContractPdfResponse | null>(null);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: shiftData, loading: shiftsLoading, error: shiftsError } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const { data: billingSummary } = useAsyncData(() => api.getHospitalBillingSummary(), []);
  const availableShifts = shiftData?.jobShifts ?? [];

  const selectedShift = useMemo(
    () => availableShifts.find((shift) => shift.id === jobShiftId) ?? null,
    [availableShifts, jobShiftId],
  );

  async function loadLifecycle(targetContractId: string) {
    const result = await api.getContractLifecycle(targetContractId);
    setLifecycle(result.lifecycle);
  }

  async function handleLoadOffersForShift() {
    if (!jobShiftId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst eine Schicht auswählen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.listHospitalOffers(jobShiftId);
      setOffers(result.offers ?? []);
      setStatus({ tone: 'success', message: 'Offers für die ausgewählte Schicht geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Offers konnten nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadLifecycle(event: React.FormEvent) {
    event.preventDefault();
    if (!contractId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst einen Contract auswählen oder eingeben.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      await loadLifecycle(contractId);
      setStatus({ tone: 'success', message: 'Contract Lifecycle geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Lifecycle konnte nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadSnapshot() {
    if (!contractId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst einen Contract auswählen oder eingeben.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.getContractSnapshot(contractId);
      setSnapshot(result.contractSnapshot);
      setStatus({ tone: 'success', message: 'Contract Snapshot geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Snapshot konnte nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadPdf() {
    if (!contractId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst einen Contract auswählen oder eingeben.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.getContractPdf(contractId);
      setPdf(result.contractPdf);
      setStatus({ tone: 'success', message: 'Contract PDF geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'PDF konnte nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExecutionSign() {
    if (!contractId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst einen Contract auswählen oder eingeben.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.signContractExecution(contractId);
      await loadLifecycle(contractId);
      setStatus({ tone: 'success', message: `Execution signiert. Neuer Status: ${result.execution.executionStatus}` });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Execution konnte nicht signiert werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVoid() {
    if (!contractId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst einen Contract auswählen oder eingeben.' });
      return;
    }
    if (!voidReason.trim()) {
      setStatus({ tone: 'error', message: 'Bitte einen Void-Grund angeben.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.voidContract(contractId, voidReason.trim());
      await loadLifecycle(contractId);
      setStatus({ tone: 'success', message: `Contract voided: ${result.voiding.executionStatus}` });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Void-Flow fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Contract Lifecycle & Governance"
        description="Read-only Audit-Sicht plus streng kontrollierte Aktionen für Execution und Voiding. Professionell, nüchtern und nachvollziehbar gestaltet."
      />
      <MetricList
        items={[
          { label: 'Signed Contracts', value: billingSummary?.signedContracts ?? '—' },
          { label: 'Invoices', value: billingSummary?.invoiceCount ?? '—' },
          { label: 'Pending Fees', value: billingSummary ? `${billingSummary.pendingInvoiceAmount} €` : '—' },
          { label: 'Paid Fees', value: billingSummary ? `${billingSummary.paidInvoiceAmount} €` : '—' },
        ]}
      />
      <div className="content-grid master-detail-grid">
        <SectionCard title="Schichten" description="Wähle einen Bedarf, um dazugehörige Offers und Contracts schneller zu finden.">
          <AsyncState loading={shiftsLoading} error={shiftsError} isEmpty={availableShifts.length === 0} emptyMessage="Noch keine Schichten vorhanden.">
            <div className="selection-list">
              {availableShifts.map((shift) => {
                const selected = jobShiftId === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    className={selected ? 'selection-card active' : 'selection-card'}
                    onClick={() => setJobShiftId(shift.id)}
                  >
                    <div>
                      <strong>{shift.title ?? 'Pflegeeinsatz'}</strong>
                      <p>{shift.locationCity ?? 'ohne Ort'}</p>
                    </div>
                    <StatusBadge value={shift.status} />
                  </button>
                );
              })}
            </div>
          </AsyncState>
        </SectionCard>

        <div className="stack">
          <form className="panel form-panel stack" onSubmit={handleLoadLifecycle}>
            <FormSection title="Schichtkontext" description="Optionaler Einstieg: Offers für die ausgewählte Schicht laden und daraus den Contract wählen.">
              <label>
                <span>Ausgewählte Job Shift ID</span>
                <input value={jobShiftId} onChange={(event) => setJobShiftId(event.target.value)} placeholder="jobShiftId" />
              </label>
              {selectedShift ? (
                <>
                  <InfoList
                    items={[
                      { label: 'Titel', value: selectedShift.title ?? 'Pflegeeinsatz' },
                      { label: 'Ort', value: selectedShift.locationCity ?? '—' },
                      { label: 'Status', value: selectedShift.status },
                    ]}
                  />
                  <MetricList
                    items={[
                      { label: 'Offers', value: offers.length },
                      { label: 'Lifecycle geladen', value: lifecycle ? 'Ja' : 'Nein' },
                      { label: 'Signed Offers', value: selectedShift.offerCounts?.signed ?? '—' },
                      { label: 'Invoiced', value: selectedShift.offerCounts?.invoiced ?? '—' },
                    ]}
                  />
                </>
              ) : null}
              <ActionBar>
                <button type="button" className="secondary" disabled={submitting || !jobShiftId} onClick={() => void handleLoadOffersForShift()}>
                  {submitting ? 'Bitte warten…' : 'Offers zur Schicht laden'}
                </button>
              </ActionBar>
            </FormSection>
            <FormSection title="Contract-Kontext" description="Die Match Contract ID öffnet den auditierbaren Lifecycle samt kontrollierter Aktionen.">
              <label>
                <span>Match Contract ID</span>
                <input value={contractId} onChange={(event) => setContractId(event.target.value)} placeholder="matchContractId" />
              </label>
            </FormSection>
            <ActionBar>
              <button type="submit" disabled={submitting || !contractId}>{submitting ? 'Lädt…' : 'Lifecycle laden'}</button>
              <button type="button" className="secondary" disabled={submitting || !contractId} onClick={() => void handleLoadSnapshot()}>{submitting ? 'Bitte warten…' : 'Snapshot laden'}</button>
              <button type="button" className="secondary" disabled={submitting || !contractId} onClick={() => void handleLoadPdf()}>{submitting ? 'Bitte warten…' : 'PDF laden'}</button>
            </ActionBar>
          </form>

          {offers.length > 0 ? (
            <SectionCard title="Offers der ausgewählten Schicht" description="Kontextnahe Offer-Liste als Einstieg in Contract-Arbeit.">
              <div className="record-list compact-list">
                {offers.map((offer) => (
                  <button
                    key={offer.id}
                    type="button"
                    className={contractId === offer.id ? 'selection-card active' : 'selection-card'}
                    onClick={() => setContractId(offer.id)}
                  >
                    <div>
                      <strong>{offer.nurse.displayName}</strong>
                      <p>{offer.id}</p>
                    </div>
                    <StatusBadge value={offer.status} />
                  </button>
                ))}
              </div>
            </SectionCard>
          ) : null}

          <div className="content-grid two-columns-equal">
            <SectionCard title="Aktionen" description="Nur echte Lifecycle-Transitions, keine Frontend-Simulationen.">
              <FormSection title="Execution" description="Signiert die Execution-Stufe auf dem echten Backend-Lifecycle.">
                <ActionBar>
                  <button type="button" disabled={submitting || !contractId} onClick={() => void handleExecutionSign()}>
                    {submitting ? 'Bitte warten…' : 'Execution signieren'}
                  </button>
                </ActionBar>
              </FormSection>
              <FormSection title="Void" description="Beendet den Contract mit dokumentiertem Grund.">
                <label>
                  <span>Void Reason</span>
                  <input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Void reason" />
                </label>
                <ActionBar>
                  <button type="button" className="secondary" disabled={submitting || !contractId || !voidReason.trim()} onClick={() => void handleVoid()}>
                    {submitting ? 'Bitte warten…' : 'Contract voiden'}
                  </button>
                </ActionBar>
              </FormSection>
            </SectionCard>
            <SectionCard title="Lifecycle Summary" description="Auditierbare Sicht auf Status, Signaturen und Vertragsartefakte.">
              {lifecycle ? (
                <>
                  <div className="summary-grid">
                    <div className="summary-card">
                      <span>Contract Status</span>
                      <StatusBadge value={lifecycle.status} />
                    </div>
                    <div className="summary-card">
                      <span>Execution Status</span>
                      <StatusBadge value={lifecycle.executionStatus} />
                    </div>
                  </div>
                  <InfoList
                    items={[
                      { label: 'Contract ID', value: lifecycle.matchContractId },
                      { label: 'Klinik', value: lifecycle.hospital?.clinicName ?? '—' },
                      { label: 'Pflegekraft', value: lifecycle.nurse?.displayName ?? '—' },
                      { label: 'Snapshots', value: lifecycle.snapshotSummary.totalSnapshots },
                      { label: 'Aktuelle Snapshot-Version', value: lifecycle.snapshotSummary.currentSnapshotVersion ?? '—' },
                      { label: 'Signaturen', value: lifecycle.signatureSummary.totalSignatures },
                      { label: 'PDF vorhanden', value: lifecycle.contractPdf.available ? 'Ja' : 'Nein' },
                      { label: 'Invoice Status', value: lifecycle.invoice?.status ?? '—' },
                      { label: 'Invoice Amount', value: lifecycle.invoice?.amount ? `${lifecycle.invoice.amount} €` : '—' },
                      { label: 'Vollständig ausgeführt', value: lifecycle.fullyExecutedAt ? new Date(lifecycle.fullyExecutedAt).toLocaleString('de-DE') : '—' },
                      { label: 'Void-Grund', value: lifecycle.voidSummary?.reason ?? '—' },
                    ]}
                  />
                </>
              ) : (
                <p className="hint">Noch kein Lifecycle geladen.</p>
              )}
            </SectionCard>
          </div>

          {snapshot ? (
            <SectionCard title="Snapshot Detail" description="Aktuell geladene Vertrags-Snapshot-Version.">
              <InfoList
                items={[
                  { label: 'Snapshot ID', value: snapshot.snapshotId },
                  { label: 'Version', value: snapshot.version },
                  { label: 'Summary', value: snapshot.summaryText },
                ]}
              />
            </SectionCard>
          ) : null}

          {pdf ? (
            <SectionCard title="PDF Artifact" description="Temporärer Download-Kontext für das Vertrags-PDF.">
              <InfoList
                items={[
                  { label: 'Object Key', value: pdf.objectKey },
                  { label: 'Expires In', value: `${pdf.expiresIn} s` },
                  { label: 'Download', value: <a href={pdf.fileUrl} target="_blank" rel="noreferrer">PDF öffnen</a> },
                ]}
              />
            </SectionCard>
          ) : null}

          {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
        </div>
      </div>
    </section>
  );
}
