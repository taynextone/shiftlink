import { useState } from 'react';
import { api, type ContractLifecycle } from '../../lib/api';

export function HospitalContractsPage() {
  const [contractId, setContractId] = useState('contract_1');
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

  return (
    <section className="stack">
      <div className="panel">
        <h1>Contract Lifecycle</h1>
        <p>Read-only Audit-Sicht für Hospitals auf Status, Execution, Snapshots, Signaturen und Voiding.</p>
      </div>
      <form className="panel stack" onSubmit={handleLoad}>
        <input value={contractId} onChange={(event) => setContractId(event.target.value)} placeholder="matchContractId" />
        <button type="submit">Lifecycle laden</button>
      </form>
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
