import { useEffect, useState } from 'react';
import { api, type OwnMatchContract } from '../../lib/api';

export function NurseMatchesPage() {
  const [contracts, setContracts] = useState<OwnMatchContract[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api.getOwnMatches()
      .then((data) => setContracts(data.matchContracts ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Angebote konnten nicht geladen werden'));
  }, []);

  async function handleRespond(matchContractId: string, action: 'ACCEPT' | 'DECLINE') {
    try {
      await api.respondToMatchOffer({ matchContractId, action });
      setStatus(`Angebot ${action === 'ACCEPT' ? 'angenommen' : 'abgelehnt'}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Aktion fehlgeschlagen');
    }
  }

  return (
    <section className="stack">
      <div className="panel">
        <h1>Eigene Angebote</h1>
        <p>Hier werden Offer-Status und nächste Aktionen sichtbar gemacht.</p>
      </div>
      {error ? <p className="hint error">{error}</p> : null}
      {status ? <p className="hint">{status}</p> : null}
      {contracts.map((contract) => (
        <article className="panel" key={contract.id}>
          <h2>{contract.jobShift.title ?? 'Pflegeeinsatz'}</h2>
          <p>{contract.jobShift.hospitalProfile.clinicName} · {contract.jobShift.locationCity ?? 'ohne Ort'}</p>
          <p>Status: <strong>{contract.status}</strong></p>
          <div className="actions">
            <button onClick={() => handleRespond(contract.id, 'ACCEPT')}>Annehmen</button>
            <button className="secondary" onClick={() => handleRespond(contract.id, 'DECLINE')}>Ablehnen</button>
          </div>
        </article>
      ))}
      {contracts.length === 0 && !error ? <div className="panel empty">Noch keine Angebote vorhanden.</div> : null}
    </section>
  );
}
