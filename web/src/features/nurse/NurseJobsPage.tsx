import { PageHeader } from '../../components/PageHeader';
import { AsyncState } from '../../components/AsyncState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function NurseJobsPage() {
  const { data, loading, error } = useAsyncData(() => api.getVisibleJobShifts(), []);
  const jobShifts = data?.jobShifts ?? [];

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Sichtbare Einsätze"
        description="Nur freigegebene Pflegekräfte sehen hier passende Bedarfe. Die Liste bildet reale Produktrestriktionen ab, keine Dummy-Marktplatzromantik."
      />
      <AsyncState loading={loading} error={error} isEmpty={jobShifts.length === 0} emptyMessage="Aktuell keine sichtbaren Einsätze.">
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
        </div>
      </AsyncState>
    </section>
  );
}
