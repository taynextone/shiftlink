import { AsyncState } from '../../components/AsyncState';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
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
            <SectionCard
              key={shift.id}
              title={shift.title ?? 'Pflegeeinsatz'}
              description={`${shift.clinicName} · ${shift.locationCity ?? 'ohne Ort'}`}
              actions={<StatusBadge value="sichtbar" />}
            >
              <InfoList
                items={[
                  { label: 'Start', value: new Date(shift.startTime).toLocaleString('de-DE') },
                  { label: 'Ende', value: new Date(shift.endTime).toLocaleString('de-DE') },
                  { label: 'Geplante Stunden', value: shift.totalPlannedHours },
                  {
                    label: 'Anforderungen',
                    value: shift.requirements.length
                      ? shift.requirements.map((requirement) => `${requirement.tag} (${requirement.priority})`).join(', ')
                      : '—',
                  },
                ]}
              />
            </SectionCard>
          ))}
        </div>
      </AsyncState>
    </section>
  );
}
