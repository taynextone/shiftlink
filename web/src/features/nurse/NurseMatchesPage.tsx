import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NurseMatchesPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getOwnMatches(), []);
  const contracts = data?.matchContracts ?? [];
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | { title: string; message: string; tone: 'danger' | 'warning' | 'neutral'; onConfirm: () => void | Promise<void> }>(null);
  function handleRespond(matchContractId: string, action: 'ACCEPT' | 'DECLINE') {
    const actionLabel = action === 'ACCEPT' ? 'annehmen' : 'ablehnen';
    setConfirmAction({
      title: `Offer ${actionLabel}`,
      message: action === 'ACCEPT'
        ? `Offer wirklich annehmen?\n\nContract: ${matchContractId}\n\nDamit wird ein verbindlicher Vertrag erzeugt.`
        : `Offer wirklich ablehnen?\n\nContract: ${matchContractId}\n\nDas Angebot wird endgültig geschlossen.`,
      tone: action === 'ACCEPT' ? 'warning' : 'danger',
      onConfirm: async () => {
        setConfirmAction(null);
        setActiveId(matchContractId);
        setStatus(null);
        try {
          await api.respondToMatchOffer({ matchContractId, action });
          setStatus({ tone: 'success', message: `Angebot ${action === 'ACCEPT' ? 'angenommen' : 'abgelehnt'}.` });
          await reload();
        } catch (err) {
          setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Aktion fehlgeschlagen' });
        } finally {
          setActiveId(null);
        }
      },
    });
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Angebote & Match-Status"
        description="Offer-Entscheidungen werden kontrolliert über den Backend-Lifecycle geführt. Diese Ansicht macht Status und Aktion professionell nachvollziehbar."
      />
      {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
      <AsyncState loading={loading} error={error} isEmpty={contracts.length === 0} emptyMessage="Noch keine Angebote vorhanden.">
        <div className="record-list">
          {contracts.map((contract) => {
            const pending = activeId === contract.id;
            return (
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
                  <button disabled={pending} onClick={() => void handleRespond(contract.id, 'ACCEPT')}>{pending ? 'Bitte warten…' : 'Annehmen'}</button>
                  <button className="secondary" disabled={pending} onClick={() => void handleRespond(contract.id, 'DECLINE')}>{pending ? 'Bitte warten…' : 'Ablehnen'}</button>
                </ActionBar>
              </SectionCard>
            );
          })}
        </div>
      </AsyncState>
      {confirmAction ? (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Bestätigen"
          cancelLabel="Abbrechen"
          tone={confirmAction.tone}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}
    </section>
  );
}
