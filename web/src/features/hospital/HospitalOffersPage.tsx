import { useState } from 'react';
import { api, type HospitalOffer } from '../../lib/api';

export function HospitalOffersPage() {
  const [jobShiftId, setJobShiftId] = useState('shift_1');
  const [offers, setOffers] = useState<HospitalOffer[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function handleLoad(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await api.listHospitalOffers(jobShiftId);
      setOffers(result.offers ?? []);
      setStatus(`Offers für ${result.jobShift.title ?? result.jobShift.id} geladen.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Offers konnten nicht geladen werden');
    }
  }

  return (
    <section className="stack">
      <div className="panel">
        <h1>Offers pro Schicht</h1>
        <p>Operative Hospital-Sicht auf Offer-Status und zugeordnete Pflegekräfte.</p>
      </div>
      <form className="panel stack" onSubmit={handleLoad}>
        <input value={jobShiftId} onChange={(event) => setJobShiftId(event.target.value)} placeholder="jobShiftId" />
        <button type="submit">Offers laden</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}
      <div className="stack">
        {offers.map((offer) => (
          <article className="panel" key={offer.id}>
            <h2>{offer.nurse.displayName}</h2>
            <p>{offer.nurse.publicId}</p>
            <p>Status: <strong>{offer.status}</strong></p>
          </article>
        ))}
        {offers.length === 0 ? <div className="panel empty">Noch keine Offers geladen.</div> : null}
      </div>
    </section>
  );
}
