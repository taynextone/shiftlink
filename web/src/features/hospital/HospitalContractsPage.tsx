import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { Link, useSearchParams } from 'react-router-dom';
import { api, type ContractExecutionOverview, type ContractLifecycle, type ContractPdfResponse, type ContractSnapshotResponse, type ContractVoidOverview, type HospitalOffer } from '../../lib/api';

import { buildVoidEscalationChecklist, interpretBillingConflict, interpretContractState, interpretInvoiceException, interpretVoidIntervention, type InterventionTone } from './ops-helpers';

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('de-DE') : '—';
}

function renderListValue(value: ReactNode) {
  return typeof value === 'string' || typeof value === 'number' ? value : value;
}

function toFeedbackTone(tone: 'success' | 'warning' | 'error' | 'info') {
  if (tone === 'warning' || tone === 'info') {
    return 'neutral' as const;
  }
  return tone;
}

export function HospitalContractsPage() {
  const [searchParams] = useSearchParams();
  const [jobShiftId, setJobShiftId] = useState('');
  const [contractId, setContractId] = useState(searchParams.get('contractId') ?? '');
  const [voidReason, setVoidReason] = useState('Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.');
  const [lifecycle, setLifecycle] = useState<ContractLifecycle | null>(null);
  const [offers, setOffers] = useState<HospitalOffer[]>([]);
  const [snapshot, setSnapshot] = useState<ContractSnapshotResponse | null>(null);
  const [pdf, setPdf] = useState<ContractPdfResponse | null>(null);
  const [execution, setExecution] = useState<ContractExecutionOverview | null>(null);
  const [voiding, setVoiding] = useState<ContractVoidOverview | null>(null);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: shiftData, loading: shiftsLoading, error: shiftsError } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const { data: billingSummaryData } = useAsyncData(() => api.getHospitalBillingSummary(), []);
  const availableShifts = shiftData?.jobShifts ?? [];

  useEffect(() => {
    const linkedContractId = searchParams.get('contractId');
    if (linkedContractId) {
      setContractId(linkedContractId);
    }
  }, [searchParams]);

  const selectedShift = useMemo(
    () => availableShifts.find((shift) => shift.id === jobShiftId) ?? null,
    [availableShifts, jobShiftId],
  );

  const contractState = useMemo(() => interpretContractState(lifecycle, execution), [execution, lifecycle]);
  const voidIntervention = useMemo(() => interpretVoidIntervention(lifecycle, voiding), [lifecycle, voiding]);
  const invoiceException = useMemo(() => interpretInvoiceException(lifecycle), [lifecycle]);
  const billingConflict = useMemo(() => interpretBillingConflict(lifecycle), [lifecycle]);
  const voidEscalationChecklist = useMemo(() => buildVoidEscalationChecklist(lifecycle), [lifecycle]);
  const canSignExecution = Boolean(contractId) && lifecycle?.status === 'SIGNED' && lifecycle.executionStatus !== 'FULLY_EXECUTED' && lifecycle.executionStatus !== 'VOIDED';
  const canVoidContract = Boolean(contractId) && voidIntervention?.label === 'Void möglich' && billingConflict?.tone !== 'error' && voidReason.trim().length > 0;

  async function loadLifecycle(targetContractId: string) {
    const result = await api.getContractLifecycle(targetContractId);
    setLifecycle(result.lifecycle);
  }

  async function loadExecution(targetContractId: string) {
    const result = await api.getContractExecutionOverview(targetContractId);
    setExecution(result.execution);
  }

  async function loadVoiding(targetContractId: string) {
    const result = await api.getContractVoidOverview(targetContractId);
    setVoiding(result.voiding);
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
      await Promise.all([loadLifecycle(contractId), loadExecution(contractId), loadVoiding(contractId)]);
      setStatus({ tone: 'success', message: 'Contract-Kontext geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Lifecycle konnte nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadExecutionOverview() {
    if (!contractId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst einen Contract auswählen oder eingeben.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      await loadExecution(contractId);
      setStatus({ tone: 'success', message: 'Execution Overview geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Execution Overview konnte nicht geladen werden' });
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
    if (!window.confirm(`Execution wirklich signieren?\n\nContract: ${contractId}`)) {
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.signContractExecution(contractId);
      await Promise.all([loadLifecycle(contractId), loadExecution(contractId), loadVoiding(contractId)]);
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
    if (!window.confirm(`Contract wirklich voiden?\n\nContract: ${contractId}\nGrund: ${voidReason.trim()}`)) {
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.voidContract(contractId, voidReason.trim());
      await Promise.all([loadLifecycle(contractId), loadExecution(contractId), loadVoiding(contractId)]);
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
          { label: 'Signed Contracts', value: billingSummaryData?.summary.signedContracts ?? '—' },
          { label: 'Invoices', value: billingSummaryData?.summary.invoiceCount ?? '—' },
          { label: 'Pending Fees', value: billingSummaryData ? `${billingSummaryData.summary.pendingInvoiceAmount} €` : '—' },
          { label: 'Paid Fees', value: billingSummaryData ? `${billingSummaryData.summary.paidInvoiceAmount} €` : '—' },
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
              <button type="submit" disabled={submitting || !contractId}>{submitting ? 'Lädt…' : 'Contract-Kontext laden'}</button>
              <button type="button" className="secondary" disabled={submitting || !contractId} onClick={() => void handleLoadExecutionOverview()}>{submitting ? 'Bitte warten…' : 'Execution laden'}</button>
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
                      <p>{offer.status} · {offer.id}</p>
                      <p>Responded: {formatDateTime(offer.respondedAt)} · Signed: {formatDateTime(offer.signedAt)}</p>
                      <p>{offer.invoiceId ? `Invoice: ${offer.invoiceId}` : 'Noch keine Rechnung verknüpft'}</p>
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
                  <button type="button" disabled={submitting || !canSignExecution} onClick={() => void handleExecutionSign()}>
                    {submitting ? 'Bitte warten…' : 'Execution signieren'}
                  </button>
                </ActionBar>
              </FormSection>
              <FormSection title="Void" description="Beendet den Contract mit dokumentiertem Grund.">
                <label>
                  <span>Void Reason</span>
                  <input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Void reason" />
                </label>
                {voidIntervention ? (
                  <>
                    <FeedbackMessage tone={toFeedbackTone(voidIntervention.tone)} message={`${voidIntervention.label}: ${voidIntervention.blocker}`} />
                    <InfoList
                      items={[
                        { label: 'Interventionsstatus', value: voidIntervention.label },
                        { label: 'Blocker / Hinweis', value: voidIntervention.blocker },
                      ]}
                    />
                  </>
                ) : null}
                {billingConflict ? <FeedbackMessage tone={toFeedbackTone(billingConflict.tone)} message={`${billingConflict.label}: ${billingConflict.detail}`} /> : null}
                {voidIntervention?.tone === 'error' || billingConflict?.tone === 'error' ? (
                  <>
                    {voidEscalationChecklist.length > 0 ? (
                      <ol className="ordered-list compact-ordered-list">
                        {voidEscalationChecklist.map((item) => <li key={item}>{item}</li>)}
                      </ol>
                    ) : null}
                    <ActionBar>
                      {lifecycle?.invoice?.id ? <Link to={`/hospital/billing?invoiceId=${encodeURIComponent(lifecycle.invoice.id)}`}><button type="button" className="secondary">Billing-Intervention öffnen</button></Link> : null}
                      {lifecycle ? <Link to={`/hospital/offers?jobShiftId=${encodeURIComponent(lifecycle.jobShiftId)}&focusContractId=${encodeURIComponent(lifecycle.matchContractId)}`}><button type="button" className="secondary">Kommunikation prüfen</button></Link> : null}
                    </ActionBar>
                  </>
                ) : null}
                <ActionBar>
                  <button type="button" className="secondary" disabled={submitting || !canVoidContract} onClick={() => void handleVoid()}>
                    {submitting ? 'Bitte warten…' : 'Contract voiden'}
                  </button>
                </ActionBar>
              </FormSection>
            </SectionCard>
            <SectionCard
              title="Lifecycle Summary"
              description="Auditierbare Sicht auf Status, Signaturen und Vertragsartefakte."
              actions={lifecycle?.nurse?.nurseProfileId ? <Link to={`/hospital/dossier?nurseProfileId=${encodeURIComponent(lifecycle.nurse.nurseProfileId)}&contractId=${encodeURIComponent(lifecycle.matchContractId)}`}>Dossier öffnen</Link> : undefined}
            >
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
                  {contractState ? (
                    <InfoList
                      items={[
                        { label: 'Operativer Zustand', value: contractState.label },
                        { label: 'Nächster Schritt', value: contractState.nextAction },
                      ]}
                    />
                  ) : null}
                  {billingConflict ? <FeedbackMessage tone={toFeedbackTone(billingConflict.tone)} message={`${billingConflict.label}: ${billingConflict.detail}`} /> : null}
                  <InfoList
                    items={[
                      { label: 'Contract ID', value: lifecycle.matchContractId },
                      { label: 'Klinik', value: lifecycle.hospital?.clinicName ?? '—' },
                      { label: 'Pflegekraft', value: lifecycle.nurse?.displayName ?? '—' },
                      { label: 'Erstellt am', value: formatDateTime(lifecycle.createdAt) },
                      { label: 'Aktualisiert am', value: formatDateTime(lifecycle.updatedAt) },
                      { label: 'Antwort erhalten', value: formatDateTime(lifecycle.respondedAt) },
                      { label: 'Offer läuft ab', value: formatDateTime(lifecycle.expiresAt) },
                      { label: 'Signiert am', value: formatDateTime(lifecycle.signedAt) },
                      { label: 'Snapshots', value: lifecycle.snapshotSummary.totalSnapshots },
                      { label: 'Aktuelle Snapshot-Version', value: lifecycle.snapshotSummary.currentSnapshotVersion ?? '—' },
                      { label: 'Signaturen', value: lifecycle.signatureSummary.totalSignatures },
                      { label: 'PDF vorhanden', value: lifecycle.contractPdf.available ? 'Ja' : 'Nein' },
                      { label: 'Invoice Status', value: lifecycle.invoice?.status ?? '—' },
                      { label: 'Invoice Amount', value: lifecycle.invoice?.amount ? `${lifecycle.invoice.amount} €` : '—' },
                      { label: 'Vollständig ausgeführt', value: formatDateTime(lifecycle.fullyExecutedAt) },
                      { label: 'Void-Grund', value: lifecycle.voidSummary?.reason ?? '—' },
                    ]}
                  />
                  <InfoList
                    items={[
                      { label: 'Billing-Ausnahmezustand', value: invoiceException.label },
                      { label: 'Billing-Nächster Schritt', value: invoiceException.nextAction },
                      { label: 'Invoice PDF', value: lifecycle.invoice?.invoicePdfUrl ? <a href={lifecycle.invoice.invoicePdfUrl} target="_blank" rel="noreferrer">Invoice PDF öffnen</a> : '—' },
                      { label: 'Billing-Intervention', value: lifecycle.invoice?.id ? <Link to={`/hospital/billing?invoiceId=${encodeURIComponent(lifecycle.invoice.id)}`}>Invoice in Billing öffnen</Link> : '—' },
                      { label: 'Kommunikationsverlauf', value: <Link to={`/hospital/offers?jobShiftId=${encodeURIComponent(lifecycle.jobShiftId)}&focusContractId=${encodeURIComponent(lifecycle.matchContractId)}`}>Offer-Kommunikation öffnen</Link> },
                    ].map((item) => ({ ...item, value: renderListValue(item.value) }))}
                  />
                  {lifecycle.snapshotSummary.versions && lifecycle.snapshotSummary.versions.length > 0 ? (
                    <SectionCard title="Snapshot-Historie" description="Versionen und Summaries des aktuellen Vertragsverlaufs.">
                      <div className="record-list compact-list">
                        {lifecycle.snapshotSummary.versions.map((version) => (
                          <div className="panel subpanel" key={version.id}>
                            <strong>Version {version.version}</strong>
                            <p>{formatDateTime(version.createdAt)}</p>
                            <p>{version.summaryText}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}
                  {lifecycle.signatureSummary.events && lifecycle.signatureSummary.events.length > 0 ? (
                    <SectionCard title="Signatur-Historie" description="Wer wann auf welchen Snapshot signiert hat.">
                      <div className="record-list compact-list">
                        {lifecycle.signatureSummary.events.map((event) => (
                          <div className="panel subpanel" key={event.id}>
                            <strong>{event.signerRole}</strong>
                            <p>{event.signatureIntent} · Snapshot {event.snapshotId}</p>
                            <p>{formatDateTime(event.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  ) : null}
                </>
              ) : (
                <p className="hint">Noch kein Lifecycle geladen.</p>
              )}
            </SectionCard>
          </div>

          {execution ? (
            <SectionCard title="Execution Detail" description="Signaturfortschritt und Rollenverteilung der Execution-Stufe.">
              <InfoList
                items={[
                  { label: 'Execution Status', value: execution.executionStatus },
                  { label: 'Signature Events', value: execution.signatureEvents.length },
                  { label: 'Fully Executed At', value: formatDateTime(execution.fullyExecutedAt) },
                ]}
              />
              <div className="record-list compact-list">
                {execution.signatureEvents.map((event) => (
                  <div className="panel subpanel" key={event.id}>
                    <strong>{event.signerRole}</strong>
                    <p>{event.signatureIntent}</p>
                    <p>{formatDateTime(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {voiding ? (
            <SectionCard title="Void Detail" description="Dokumentierte Void-Lage und Interventionskontext.">
              <InfoList
                items={[
                  { label: 'Contract Status', value: voiding.status },
                  { label: 'Execution Status', value: voiding.executionStatus },
                  { label: 'Void vorhanden', value: voiding.voidEvent ? 'Ja' : 'Nein' },
                  { label: 'Void Actor', value: voiding.voidEvent?.actorRole ?? '—' },
                  { label: 'Void At', value: formatDateTime(voiding.voidEvent?.createdAt) },
                  { label: 'Void Reason', value: voiding.voidEvent?.reason ?? '—' },
                ]}
              />
            </SectionCard>
          ) : null}

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
