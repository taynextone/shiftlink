import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
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
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Sichtbare Einsätze"
        description="Nur freigegebene Pflegekräfte sehen hier passende Bedarfe. Die Liste bildet reale Produktrestriktionen ab, keine Dummy-Marktplatzromantik."
      />
      {error ? <p className="hint error">{error}</p> : null}
      <div className="record-list">
        {jobShifts.map((shift) => (
          <article className="panel record-card" key={shift.id}>
            <div className="record-card-main">
              <h2>{shift.title ?? 'Pflegeeinsatz'}</h2>
              <p>{shift.clinicName} · {shift.locationCity ?? 'ohne Ort'}</p>
            </div>
            <div className="record-card-meta">
              <span>{new Date(shift.startTime).toLocaleString('de-DE')}</span>
              <span>{new Date(shift.endTime).toLocaleString('de-DE')}</span>
            </div>
          </article>
        ))}
        {jobShifts.length === 0 && !error ? <div className="panel empty">Aktuell keine sichtbaren Einsätze.</div> : null}
      </div>
    </section>
  );
}
