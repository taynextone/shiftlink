import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
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
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Angebote & Match-Status"
        description="Offer-Entscheidungen werden kontrolliert über den Backend-Lifecycle geführt. Diese Ansicht macht Status und Aktion professionell nachvollziehbar."
      />
      {error ? <p className="hint error">{error}</p> : null}
      {status ? <p className="hint">{status}</p> : null}
      <div className="record-list">
        {contracts.map((contract) => (
          <article className="panel record-card spaced" key={contract.id}>
            <div className="record-card-main">
              <h2>{contract.jobShift.title ?? 'Pflegeeinsatz'}</h2>
              <p>{contract.jobShift.hospitalProfile.clinicName} · {contract.jobShift.locationCity ?? 'ohne Ort'}</p>
            </div>
            <div className="record-card-meta align-right">
              <strong>{contract.status}</strong>
              <div className="actions compact">
                <button onClick={() => handleRespond(contract.id, 'ACCEPT')}>Annehmen</button>
                <button className="secondary" onClick={() => handleRespond(contract.id, 'DECLINE')}>Ablehnen</button>
              </div>
            </div>
          </article>
        ))}
        {contracts.length === 0 && !error ? <div className="panel empty">Noch keine Angebote vorhanden.</div> : null}
      </div>
    </section>
  );
}
