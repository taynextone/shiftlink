import { useEffect, useState } from 'react';
import { api, type VisibleJobShift } from '../../lib/api';

export function NurseJobsPage() {
  const [jobShifts, setJobShifts] = useState<VisibleJobShift[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getVisibleJobShifts()
      .then((data) => setJobShifts(data.jobShifts ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Einsätze konnten nicht geladen werden'));
  }, []);

  return (
    <section className="stack">
      <div className="panel">
        <h1>Sichtbare Einsätze</h1>
        <p>Unreleased Pflegekräfte sehen hier bewusst nichts. Sichtbarkeit ist an Verifikation und Freigabe gekoppelt.</p>
      </div>
      {error ? <p className="hint error">{error}</p> : null}
      <div className="stack">
        {jobShifts.map((shift) => (
          <article className="panel" key={shift.id}>
            <h2>{shift.title ?? 'Pflegeeinsatz'}</h2>
            <p>{shift.clinicName} · {shift.locationCity ?? 'ohne Ort'}</p>
            <p>{new Date(shift.startTime).toLocaleString('de-DE')} – {new Date(shift.endTime).toLocaleString('de-DE')}</p>
          </article>
        ))}
        {jobShifts.length === 0 && !error ? <div className="panel empty">Aktuell keine sichtbaren Einsätze.</div> : null}
      </div>
    </section>
  );
}
