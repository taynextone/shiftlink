import { useMemo, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api, type Candidate, type HospitalJobShift, type HospitalOffer } from '../../lib/api';

export function HospitalOffersPage() {
  const { data: shiftData, loading: shiftsLoading, error: shiftsError } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const availableShifts = shiftData?.jobShifts ?? [];
  const [jobShiftId, setJobShiftId] = useState('');
  const [offers, setOffers] = useState<HospitalOffer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeShift, setActiveShift] = useState<HospitalJobShift | null>(null);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedShift = useMemo(
    () => availableShifts.find((shift) => shift.id === jobShiftId) ?? activeShift,
    [availableShifts, activeShift, jobShiftId],
  );

  async function loadOffers(targetShiftId: string) {
    const result = await api.listHospitalOffers(targetShiftId);
    setOffers(result.offers ?? []);
    setActiveShift(result.jobShift);
    setStatus({ tone: 'success', message: `Offers für ${result.jobShift.title ?? result.jobShift.id} geladen.` });
  }

  async function handleLoadOffers(event: React.FormEvent) {
    event.preventDefault();
    if (!jobShiftId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst eine Schicht auswählen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      await loadOffers(jobShiftId);
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Offers konnten nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadCandidates() {
    if (!jobShiftId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst eine Schicht auswählen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.findCandidates(jobShiftId);
      setCandidates(result.candidates ?? []);
      setStatus({ tone: 'success', message: 'Kandidaten geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Kandidaten konnten nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateOffer(nurseProfileId: string) {
    if (!jobShiftId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst eine Schicht auswählen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.createOffer({ jobShiftId, nurseProfileId });
      await loadOffers(jobShiftId);
      setStatus({ tone: 'success', message: `Offer erstellt: ${result.matchContract.id}` });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Offer konnte nicht erstellt werden' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Offers & Kandidatensteuerung"
        description="Professionelle Arbeitsfläche für Kandidatensuche und Angebotsauslösung. Fokus auf belastbare operative Schritte statt visuellem Spielzeug."
      />
      <div className="content-grid master-detail-grid">
        <SectionCard title="Schichten" description="Wähle einen vorhandenen Bedarf als Arbeitskontext für Offers und Kandidaten.">
          <AsyncState loading={shiftsLoading} error={shiftsError} isEmpty={availableShifts.length === 0} emptyMessage="Noch keine Schichten vorhanden.">
            <div className="selection-list">
              {availableShifts.map((shift) => {
                const selected = jobShiftId === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    className={selected ? 'selection-card active' : 'selection-card'}
                    onClick={() => setJobShiftId(shift.id)}
                  >
                    <div>
                      <strong>{shift.title ?? 'Pflegeeinsatz'}</strong>
                      <p>{shift.locationCity ?? 'ohne Ort'}</p>
                    </div>
                    <StatusBadge value={shift.status} />
                  </button>
                );
              })}
            </div>
          </AsyncState>
        </SectionCard>

        <div className="stack">
          <form className="panel form-panel stack" onSubmit={handleLoadOffers}>
            <FormSection title="Operativer Kontext" description="Die ausgewählte Schicht steuert Kandidatensuche und Offer-Liste in einem gemeinsamen Arbeitsraum.">
              <label>
                <span>Ausgewählte Job Shift ID</span>
                <input value={jobShiftId} onChange={(event) => setJobShiftId(event.target.value)} placeholder="jobShiftId" />
              </label>
              {selectedShift ? (
                <>
                  <InfoList
                    items={[
                      { label: 'Titel', value: selectedShift.title ?? 'Pflegeeinsatz' },
                      { label: 'Ort', value: selectedShift.locationCity ?? '—' },
                      { label: 'Start', value: new Date(selectedShift.startTime).toLocaleString('de-DE') },
                      { label: 'Ende', value: new Date(selectedShift.endTime).toLocaleString('de-DE') },
                    ]}
                  />
                  <MetricList
                    items={[
                      { label: 'Offers', value: offers.length },
                      { label: 'Kandidaten', value: candidates.length },
                    ]}
                  />
                </>
              ) : null}
            </FormSection>
            <ActionBar>
              <button type="submit" disabled={submitting || !jobShiftId}>{submitting ? 'Lädt…' : 'Offers laden'}</button>
              <button type="button" className="secondary" disabled={submitting || !jobShiftId} onClick={() => void handleLoadCandidates()}>
                {submitting ? 'Bitte warten…' : 'Kandidaten suchen'}
              </button>
            </ActionBar>
          </form>

          {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}

          <div className="content-grid two-columns-equal">
            <section className="stack">
              <div className="section-heading-row">
                <h2 className="section-heading">Kandidaten</h2>
                <StatusBadge value={`${candidates.length} profile`} />
              </div>
              {candidates.map((candidate) => (
                <SectionCard
                  key={candidate.nurseProfileId}
                  title={candidate.displayName}
                  description={`${candidate.publicId} · ${candidate.matchingCity}`}
                  actions={<StatusBadge value={candidate.preferredShiftType} />}
                >
                  <InfoList
                    items={[
                      { label: 'Min. Rate', value: `${candidate.minHourlyRate} €` },
                      { label: 'Match-Fit', value: candidate.preferredTagMatches },
                      { label: 'Availability Block', value: candidate.matchingAvailabilityBlockId },
                    ]}
                  />
                  <ActionBar>
                    <button disabled={submitting} onClick={() => void handleCreateOffer(candidate.nurseProfileId)}>
                      {submitting ? 'Bitte warten…' : 'Offer erstellen'}
                    </button>
                  </ActionBar>
                </SectionCard>
              ))}
              {candidates.length === 0 ? <div className="panel empty">Noch keine Kandidaten geladen.</div> : null}
            </section>
            <section className="stack">
              <div className="section-heading-row">
                <h2 className="section-heading">Offers</h2>
                <StatusBadge value={`${offers.length} active`} />
              </div>
              {offers.map((offer) => (
                <SectionCard
                  key={offer.id}
                  title={offer.nurse.displayName}
                  description={offer.nurse.publicId}
                  actions={<StatusBadge value={offer.status} />}
                >
                  <InfoList
                    items={[
                      { label: 'Offer ID', value: offer.id },
                      { label: 'Min. Rate', value: `${offer.nurse.minHourlyRate} €` },
                    ]}
                  />
                </SectionCard>
              ))}
              {offers.length === 0 ? <div className="panel empty">Noch keine Offers geladen.</div> : null}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
