import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { api, type HospitalJobShift } from '../../lib/api';

export function HospitalShiftsPage() {
  const [jobShifts, setJobShifts] = useState<HospitalJobShift[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [externalJobShiftId, setExternalJobShiftId] = useState('ext-demo-1');
  const [title, setTitle] = useState('ITS Einsatz');

  useEffect(() => {
    api.listHospitalJobShifts()
      .then((data) => setJobShifts(data.jobShifts ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Schichten konnten nicht geladen werden'));
  }, []);

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await api.importHospitalJobShift({
        externalJobShiftId,
        title,
        locationCity: 'Berlin',
        startTime: '2026-06-16T06:00:00.000Z',
        endTime: '2026-06-20T18:00:00.000Z',
        totalPlannedHours: 12,
        requirements: [{ tag: 'Intensivstation', priority: 'REQUIRED' }],
      });
      setStatus(`Import ${result.mode === 'created' ? 'angelegt' : 'aktualisiert'}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import fehlgeschlagen');
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Schichten & Bedarfseingang"
        description="Operative Bedarfe mit professioneller, zurückhaltender Oberfläche. Keine generische Demo-Tabelle, sondern ein klarer Arbeitskontext für Imports und Statussicht." 
      />
      <form className="panel form-panel stack" onSubmit={handleImport}>
        <div className="form-grid two">
          <label>
            <span>External Job Shift ID</span>
            <input value={externalJobShiftId} onChange={(event) => setExternalJobShiftId(event.target.value)} placeholder="externalJobShiftId" />
          </label>
          <label>
            <span>Titel</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" />
          </label>
        </div>
        <div className="actions">
          <button type="submit">Shift importieren</button>
        </div>
      </form>
      {status ? <p className="hint">{status}</p> : null}
      {error ? <p className="hint error">{error}</p> : null}
      <div className="record-list">
        {jobShifts.map((shift) => (
          <article className="panel record-card spaced" key={shift.id}>
            <div className="record-card-main">
              <h2>{shift.title ?? 'Pflegeeinsatz'}</h2>
              <p>{shift.locationCity ?? 'ohne Ort'}</p>
            </div>
            <div className="record-card-meta align-right">
              <strong>{shift.status}</strong>
              <span>{new Date(shift.startTime).toLocaleString('de-DE')}</span>
            </div>
          </article>
        ))}
        {jobShifts.length === 0 && !error ? <div className="panel empty">Noch keine Schichten vorhanden.</div> : null}
      </div>
    </section>
  );
}
