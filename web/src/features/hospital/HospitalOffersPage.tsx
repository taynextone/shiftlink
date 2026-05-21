import { useState } from 'react';
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
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Offer konnte nicht erstellt werden');
    }
  }

  return (
    <section className="stack">
      <div className="panel">
        <h1>Offers & Kandidaten</h1>
        <p>Hier wird der Hospital-Flow von Kandidatensuche bis Offer-Erstellung sichtbar gemacht.</p>
      </div>
      <form className="panel stack" onSubmit={handleLoadOffers}>
        <input value={jobShiftId} onChange={(event) => setJobShiftId(event.target.value)} placeholder="jobShiftId" />
        <div className="actions">
          <button type="submit">Offers laden</button>
          <button type="button" className="secondary" onClick={handleLoadCandidates}>Kandidaten suchen</button>
        </div>
      </form>
      {status ? <p className="hint">{status}</p> : null}
      <div className="grid two">
        <div className="stack">
          <h2 className="section-heading">Kandidaten</h2>
          {candidates.map((candidate) => (
            <article className="panel" key={candidate.nurseProfileId}>
              <h3>{candidate.displayName}</h3>
              <p>{candidate.publicId} · {candidate.matchingCity}</p>
              <p>Tag-Matches: {candidate.preferredTagMatches}</p>
              <button onClick={() => handleCreateOffer(candidate.nurseProfileId)}>Offer erstellen</button>
            </article>
          ))}
          {candidates.length === 0 ? <div className="panel empty">Noch keine Kandidaten geladen.</div> : null}
        </div>
        <div className="stack">
          <h2 className="section-heading">Offers</h2>
          {offers.map((offer) => (
            <article className="panel" key={offer.id}>
              <h3>{offer.nurse.displayName}</h3>
              <p>{offer.nurse.publicId}</p>
              <p>Status: <strong>{offer.status}</strong></p>
            </article>
          ))}
          {offers.length === 0 ? <div className="panel empty">Noch keine Offers geladen.</div> : null}
        </div>
      </div>
    </section>
  );
}
