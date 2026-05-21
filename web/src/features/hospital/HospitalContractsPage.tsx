import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { api, type ContractLifecycle } from '../../lib/api';

export function HospitalContractsPage() {
  const [contractId, setContractId] = useState('contract_1');
  const [voidReason, setVoidReason] = useState('Pflegekraft kann den Einsatz in diesem Zeitraum doch nicht wahrnehmen.');
  const [lifecycle, setLifecycle] = useState<ContractLifecycle | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleLoad(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await api.getContractLifecycle(contractId);
      setLifecycle(result.lifecycle);
      setStatus('Contract Lifecycle geladen.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Lifecycle konnte nicht geladen werden');
    }
  }

  async function handleExecutionSign() {
    try {
      const result = await api.signContractExecution(contractId);
      setStatus(`Execution signiert. Neuer Status: ${result.execution.executionStatus}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Execution konnte nicht signiert werden');
    }
  }

  async function handleVoid() {
    try {
      const result = await api.voidContract(contractId, voidReason);
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
        <label>
          <span>Match Contract ID</span>
          <input value={contractId} onChange={(event) => setContractId(event.target.value)} placeholder="matchContractId" />
        </label>
        <div className="actions">
          <button type="submit">Lifecycle laden</button>
        </div>
      </form>
      <div className="content-grid two-columns-equal">
        <div className="panel form-panel stack">
          <h2>Aktionen</h2>
          <button type="button" onClick={handleExecutionSign}>Execution signieren</button>
          <label>
            <span>Void Reason</span>
            <input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Void reason" />
          </label>
          <button type="button" className="secondary" onClick={handleVoid}>Contract voiden</button>
        </div>
        <div className="panel detail-panel stack">
          <h2>Lifecycle Summary</h2>
          {lifecycle ? (
            <>
              <div className="detail-row"><span>Status</span><strong>{lifecycle.status}</strong></div>
              <div className="detail-row"><span>Execution</span><strong>{lifecycle.executionStatus}</strong></div>
              <div className="detail-row"><span>Snapshots</span><strong>{lifecycle.snapshotSummary.totalSnapshots}</strong></div>
              <div className="detail-row"><span>Signaturen</span><strong>{lifecycle.signatureSummary.totalSignatures}</strong></div>
              <div className="detail-row"><span>PDF vorhanden</span><strong>{lifecycle.contractPdf.available ? 'Ja' : 'Nein'}</strong></div>
              {lifecycle.voidSummary ? <div className="detail-row"><span>Void-Grund</span><strong>{lifecycle.voidSummary.reason}</strong></div> : null}
            </>
          ) : (
            <p className="hint">Noch kein Lifecycle geladen.</p>
          )}
        </div>
      </div>
      {status ? <p className="hint">{status}</p> : null}
    </section>
  );
}
