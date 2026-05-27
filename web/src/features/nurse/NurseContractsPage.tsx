import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { SignatureDialog } from '../../components/SignatureDialog';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NurseContractsPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.getOwnMatches(), []);
  const contracts = data?.matchContracts ?? [];
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [signatureDialog, setSignatureDialog] = useState<null | {
    contractId: string;
    party: 'NURSE';
    title: string;
    consentText: string;
  }>(null);
  const [consentText, setConsentText] = useState('');



  const activeContract = contracts.find((c) => c.id === activeId) ?? contracts[0] ?? null;

  function handleSignNurse(contractId: string) {
    const consent = consentText.trim() || 'Ich bestätige hiermit den Vertrag elektronisch.';
    setSignatureDialog({
      contractId,
      party: 'NURSE',
      title: 'Vertrag als Pflegekraft unterschreiben',
      consentText: consent,
    });
  }

  function handleDownloadPdf(contractId: string) {
    api.getContractPdf(contractId).then((result) => {
      if (result.contractPdf?.fileUrl) window.open(result.contractPdf.fileUrl, '_blank');
    }).catch(() => {
      setStatus({ tone: 'error', message: 'PDF-Download fehlgeschlagen' });
    });
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Meine Verträge"
        description="Hier sehen Sie Ihre aktiven Verträge und können diese rechtskräftig unterschreiben."
      />
      {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
      <AsyncState loading={loading} error={error} isEmpty={contracts.length === 0} emptyMessage="Noch keine Verträge vorhanden.">
        <div className="content-grid">
          <div className="stack">
            {contracts.map((contract) => (
              <SectionCard
                key={contract.id}
                title={contract.jobShift.title ?? 'Pflegeeinsatz'}
                description={`${contract.jobShift.hospitalProfile.clinicName} · ${contract.jobShift.locationCity ?? 'ohne Ort'}`}
                actions={<span style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><StatusBadge value={contract.status} /><button type="button" className={contract.id === activeId ? 'btn btn-primary btn-sm' : 'btn btn-sm'} onClick={() => setActiveId(contract.id)}>{contract.id === activeId ? 'Ausgewählt' : 'Auswählen'}</button></span>}
              >
                <InfoList
                  items={[
                    { label: 'Start', value: new Date(contract.jobShift.startTime).toLocaleString('de-DE') },
                    { label: 'Ende', value: new Date(contract.jobShift.endTime).toLocaleString('de-DE') },
                    { label: 'Status', value: contract.status },
                  ]}
                />
              </SectionCard>
            ))}
          </div>

          {activeContract ? (
            <SectionCard
              title="Vertragsdetails"
              description={`${activeContract.jobShift.title ?? 'Pflegeeinsatz'} · ${activeContract.jobShift.hospitalProfile.clinicName}`}
            >
              <InfoList
                items={[
                  { label: 'Vertrag', value: activeContract.id },
                  { label: 'Klinik', value: activeContract.jobShift.hospitalProfile.clinicName },
                  { label: 'Status', value: activeContract.status },
                  { label: 'Start', value: new Date(activeContract.jobShift.startTime).toLocaleString('de-DE') },
                  { label: 'Ende', value: new Date(activeContract.jobShift.endTime).toLocaleString('de-DE') },
                  { label: 'Geplante Stunden', value: `${(activeContract.jobShift as any).totalPlannedHours ?? '—'}h` },
                  { label: 'Stundensatz', value: `${(activeContract as any).nurseProfile?.minHourlyRate ?? '—'} €/h` },
                ]}
              />

              <div style={{ marginTop: '1rem' }}>
                <label>
                  <span>Bestätigungstext</span>
                  <input
                    value={consentText}
                    onChange={(e) => setConsentText(e.target.value)}
                    placeholder="Ich bestätige hiermit den Vertrag elektronisch."
                  />
                </label>
              </div>

              <ActionBar>
                <button
                  type="button"
                  disabled={activeContract.status !== 'ACTIVE' && activeContract.status !== 'SIGNED'}
                  onClick={() => handleSignNurse(activeContract.id)}
                >
                  Unterschreiben
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleDownloadPdf(activeContract.id)}
                >
                  PDF herunterladen
                </button>
              </ActionBar>
            </SectionCard>
          ) : (
            <SectionCard title="Kein Vertrag ausgewählt" description="Wählen Sie einen Vertrag aus der Liste."><p className="hint">Kein Vertrag ausgewählt</p></SectionCard>
          )}
        </div>
      </AsyncState>

      {signatureDialog ? (
        <SignatureDialog
          title={signatureDialog.title}
          contractId={signatureDialog.contractId}
          party={signatureDialog.party}
          consentText={signatureDialog.consentText}
          onSign={async (cid, p, consent, sigImg) => {
            const result = await api.signContract(cid, p, consent, sigImg);
            await reload();
            return { fullyExecuted: result.fullyExecuted };
          }}
          onClose={() => setSignatureDialog(null)}
          onStatus={setStatus}
        />
      ) : null}
    </section>
  );
}
