import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { api, type Candidate, type HospitalOffer } from '../../lib/api';

export function HospitalOffersPage() {
  const [jobShiftId, setJobShiftId] = useState('shift_1');
  const [offers, setOffers] = useState<HospitalOffer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function loadOffers() {
    const result = await api.listHospitalOffers(jobShiftId);
    setOffers(result.offers ?? []);
    setStatus(`Offers für ${result.jobShift.title ?? result.jobShift.id} geladen.`);
  }

  async function handleLoadOffers(event: React.FormEvent) {
    event.preventDefault();
    try {
      await loadOffers();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Offers konnten nicht geladen werden');
    }
  }

  async function handleLoadCandidates() {
    try {
      const result = await api.findCandidates(jobShiftId);
      setCandidates(result.candidates ?? []);
      setStatus('Kandidaten geladen.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Kandidaten konnten nicht geladen werden');
    }
  }

  async function handleCreateOffer(nurseProfileId: string) {
    try {
      const result = await api.createOffer({ jobShiftId, nurseProfileId });
      setStatus(`Offer erstellt: ${result.matchContract.id}`);
      await loadOffers();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Offer konnte nicht erstellt werden');
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Offers & Kandidatensteuerung"
        description="Professionelle Arbeitsfläche für Kandidatensuche und Angebotsauslösung. Fokus auf belastbare operative Schritte statt visuellem Spielzeug."
      />
      <form className="panel form-panel stack" onSubmit={handleLoadOffers}>
        <FormSection title="Operativer Kontext" description="Die Job Shift ID steuert Kandidatensuche und Offer-Liste in einem gemeinsamen Arbeitsraum.">
          <label>
            <span>Job Shift ID</span>
            <input value={jobShiftId} onChange={(event) => setJobShiftId(event.target.value)} placeholder="jobShiftId" />
          </label>
        </FormSection>
        <ActionBar>
          <button type="submit">Offers laden</button>
          <button type="button" className="secondary" onClick={() => void handleLoadCandidates()}>Kandidaten suchen</button>
        </ActionBar>
      </form>
      {status ? <p className="hint">{status}</p> : null}
      <div className="content-grid two-columns-equal">
        <section className="stack">
          <h2 className="section-heading">Kandidaten</h2>
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
                <button onClick={() => void handleCreateOffer(candidate.nurseProfileId)}>Offer erstellen</button>
              </ActionBar>
            </SectionCard>
          ))}
          {candidates.length === 0 ? <div className="panel empty">Noch keine Kandidaten geladen.</div> : null}
        </section>
        <section className="stack">
          <h2 className="section-heading">Offers</h2>
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
    </section>
  );
}
