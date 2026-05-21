import { useState } from 'react';
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
    <section className="stack">
      <div className="panel">
        <h1>Contract Lifecycle</h1>
        <p>Read-only Audit-Sicht plus kontrollierte Hospital-Aktionen für Execution und Voiding.</p>
      </div>
      <form className="panel stack" onSubmit={handleLoad}>
        <input value={contractId} onChange={(event) => setContractId(event.target.value)} placeholder="matchContractId" />
        <button type="submit">Lifecycle laden</button>
      </form>
      <div className="panel stack">
        <h2>Aktionen</h2>
        <div className="actions">
          <button type="button" onClick={handleExecutionSign}>Execution signieren</button>
        </div>
        <input value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="Void reason" />
        <button type="button" className="secondary" onClick={handleVoid}>Contract voiden</button>
      </div>
      {status ? <p className="hint">{status}</p> : null}
      {lifecycle ? (
        <article className="panel stack">
          <p>Status: <strong>{lifecycle.status}</strong></p>
          <p>Execution: <strong>{lifecycle.executionStatus}</strong></p>
          <p>Snapshots: {lifecycle.snapshotSummary.totalSnapshots}</p>
          <p>Signaturen: {lifecycle.signatureSummary.totalSignatures}</p>
          <p>PDF vorhanden: {lifecycle.contractPdf.available ? 'Ja' : 'Nein'}</p>
          {lifecycle.voidSummary ? <p>Void-Grund: {lifecycle.voidSummary.reason}</p> : null}
        </article>
      ) : null}
    </section>
  );
}
