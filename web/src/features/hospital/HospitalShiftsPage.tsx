import { useEffect, useState } from 'react';
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
    <section className="stack">
      <div className="panel">
        <h1>Hospital Schichten</h1>
        <p>Hier wird die erste operative Schichtliste und der idempotente Import-Flow abgebildet.</p>
      </div>
      <form className="panel stack" onSubmit={handleImport}>
        <h2>Shift importieren</h2>
        <input value={externalJobShiftId} onChange={(event) => setExternalJobShiftId(event.target.value)} placeholder="externalJobShiftId" />
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" />
        <button type="submit">Import auslösen</button>
      </form>
      {status ? <p className="hint">{status}</p> : null}
      {error ? <p className="hint error">{error}</p> : null}
      <div className="stack">
        {jobShifts.map((shift) => (
          <article className="panel" key={shift.id}>
            <h2>{shift.title ?? 'Pflegeeinsatz'}</h2>
            <p>Status: <strong>{shift.status}</strong></p>
            <p>{shift.locationCity ?? 'ohne Ort'} · {new Date(shift.startTime).toLocaleString('de-DE')}</p>
          </article>
        ))}
        {jobShifts.length === 0 && !error ? <div className="panel empty">Noch keine Schichten vorhanden.</div> : null}
      </div>
    </section>
  );
}
