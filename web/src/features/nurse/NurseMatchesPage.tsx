import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
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
            <SectionCard
              key={contract.id}
              title={contract.jobShift.title ?? 'Pflegeeinsatz'}
              description={`${contract.jobShift.hospitalProfile.clinicName} · ${contract.jobShift.locationCity ?? 'ohne Ort'}`}
              actions={<StatusBadge value={contract.status} />}
            >
              <InfoList
                items={[
                  { label: 'Start', value: new Date(contract.jobShift.startTime).toLocaleString('de-DE') },
                  { label: 'Ende', value: new Date(contract.jobShift.endTime).toLocaleString('de-DE') },
                  { label: 'Expires At', value: contract.expiresAt ? new Date(contract.expiresAt).toLocaleString('de-DE') : '—' },
                  { label: 'Signed At', value: contract.signedAt ? new Date(contract.signedAt).toLocaleString('de-DE') : '—' },
                ]}
              />
              <ActionBar>
                <button onClick={() => void handleRespond(contract.id, 'ACCEPT')}>Annehmen</button>
                <button className="secondary" onClick={() => void handleRespond(contract.id, 'DECLINE')}>Ablehnen</button>
              </ActionBar>
            </SectionCard>
          ))}
        </div>
      </AsyncState>
    </section>
  );
}
