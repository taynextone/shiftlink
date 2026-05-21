import { useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { AsyncState } from '../../components/AsyncState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NurseMatchesPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getOwnMatches(), []);
  const contracts = data?.matchContracts ?? [];
  const [status, setStatus] = useState<string | null>(null);

  async function handleRespond(matchContractId: string, action: 'ACCEPT' | 'DECLINE') {
    try {
      await api.respondToMatchOffer({ matchContractId, action });
      setStatus(`Angebot ${action === 'ACCEPT' ? 'angenommen' : 'abgelehnt'}.`);
      await reload();
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
      {status ? <p className="hint">{status}</p> : null}
      <AsyncState loading={loading} error={error} isEmpty={contracts.length === 0} emptyMessage="Noch keine Angebote vorhanden.">
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
                  <button onClick={() => void handleRespond(contract.id, 'ACCEPT')}>Annehmen</button>
                  <button className="secondary" onClick={() => void handleRespond(contract.id, 'DECLINE')}>Ablehnen</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </AsyncState>
    </section>
  );
}
