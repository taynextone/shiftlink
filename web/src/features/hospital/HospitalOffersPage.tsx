import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { api, type Candidate, type HospitalOffer } from '../../lib/api';

export function HospitalOffersPage() {
  const [jobShiftId, setJobShiftId] = useState('shift_1');
  const [offers, setOffers] = useState<HospitalOffer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function handleLoadOffers(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await api.listHospitalOffers(jobShiftId);
      setOffers(result.offers ?? []);
      setStatus(`Offers für ${result.jobShift.title ?? result.jobShift.id} geladen.`);
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
      await handleLoadOffers({ preventDefault() {} } as React.FormEvent);
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
        <label>
          <span>Job Shift ID</span>
          <input value={jobShiftId} onChange={(event) => setJobShiftId(event.target.value)} placeholder="jobShiftId" />
        </label>
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
            <article className="panel record-card spaced" key={candidate.nurseProfileId}>
              <div className="record-card-main">
                <h3>{candidate.displayName}</h3>
                <p>{candidate.publicId} · {candidate.matchingCity}</p>
                <p>Min. Rate: {candidate.minHourlyRate} € · Match-Fit: {candidate.preferredTagMatches}</p>
              </div>
              <div className="record-card-meta align-right">
                <span>{candidate.preferredShiftType}</span>
                <button onClick={() => void handleCreateOffer(candidate.nurseProfileId)}>Offer erstellen</button>
              </div>
            </article>
          ))}
          {candidates.length === 0 ? <div className="panel empty">Noch keine Kandidaten geladen.</div> : null}
        </section>
        <section className="stack">
          <h2 className="section-heading">Offers</h2>
          {offers.map((offer) => (
            <article className="panel record-card spaced" key={offer.id}>
              <div className="record-card-main">
                <h3>{offer.nurse.displayName}</h3>
                <p>{offer.nurse.publicId}</p>
                <p>Min. Rate: {offer.nurse.minHourlyRate} €</p>
              </div>
              <div className="record-card-meta align-right">
                <StatusBadge value={offer.status} />
              </div>
            </article>
          ))}
          {offers.length === 0 ? <div className="panel empty">Noch keine Offers geladen.</div> : null}
        </section>
      </div>
    </section>
  );
}
