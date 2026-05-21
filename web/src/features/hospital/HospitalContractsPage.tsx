import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { api, type ContractLifecycle } from '../../lib/api';

export function HospitalContractsPage() {
  const [contractId, setContractId] = useState('contract_1');
  const [voidReason, setVoidReason] = useState('Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.');
  const [lifecycle, setLifecycle] = useState<ContractLifecycle | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function loadLifecycle() {
    const result = await api.getContractLifecycle(contractId);
    setLifecycle(result.lifecycle);
  }

  async function handleLoad(event: React.FormEvent) {
    event.preventDefault();
    try {
      await loadLifecycle();
      setStatus('Contract Lifecycle geladen.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Lifecycle konnte nicht geladen werden');
    }
  }

  async function handleExecutionSign() {
    try {
      const result = await api.signContractExecution(contractId);
      await loadLifecycle();
      setStatus(`Execution signiert. Neuer Status: ${result.execution.executionStatus}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Execution konnte nicht signiert werden');
    }
  }

  async function handleVoid() {
    try {
      const result = await api.voidContract(contractId, voidReason);
      await loadLifecycle();
      setStatus(`Contract voided: ${result.voiding.executionStatus}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Void-Flow fehlgeschlagen');
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Contract Lifecycle & Governance"
        description="Read-only Audit-Sicht plus streng kontrollierte Aktionen für Execution und Voiding. Professionell, nüchtern und nachvollziehbar gestaltet."
      />
      <form className="panel form-panel stack" onSubmit={handleLoad}>
        <FormSection title="Contract-Kontext" description="Die Match Contract ID öffnet den auditierbaren Lifecycle samt kontrollierter Aktionen.">
          <label>
            <span>Match Contract ID</span>
            <input value={contractId} onChange={(event) => setContractId(event.target.value)} placeholder="matchContractId" />
          </label>
        </FormSection>
        <ActionBar>
          <button type="submit">Lifecycle laden</button>
        </ActionBar>
      </form>
      <div className="content-grid two-columns-equal">
        <SectionCard title="Aktionen" description="Nur echte Lifecycle-Transitions, keine Frontend-Simulationen.">
          <FormSection title="Execution" description="Signiert die Execution-Stufe auf dem echten Backend-Lifecycle.">
            <ActionBar>
              <button type="button" onClick={() => void handleExecutionSign()}>Execution signieren</button>
            </ActionBar>
          </FormSection>
          <FormSection title="Void" description="Beendet den Contract mit dokumentiertem Grund.">
            <label>
              <span>Void Reason</span>
              <input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Void reason" />
            </label>
            <ActionBar>
              <button type="button" className="secondary" onClick={() => void handleVoid()}>Contract voiden</button>
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
                  { label: 'Snapshots', value: lifecycle.snapshotSummary.totalSnapshots },
                  { label: 'Aktuelle Snapshot-Version', value: lifecycle.snapshotSummary.currentSnapshotVersion ?? '—' },
                  { label: 'Signaturen', value: lifecycle.signatureSummary.totalSignatures },
                  { label: 'PDF vorhanden', value: lifecycle.contractPdf.available ? 'Ja' : 'Nein' },
                  { label: 'PDF URL', value: lifecycle.contractPdf.fileUrl ?? '—' },
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
      {status ? <p className="hint">{status}</p> : null}
    </section>
  );
}
