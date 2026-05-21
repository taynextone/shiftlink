import { useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

export function HospitalShiftsPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const jobShifts = data?.jobShifts ?? [];
  const [status, setStatus] = useState<string | null>(null);
  const [externalJobShiftId, setExternalJobShiftId] = useState('ext-demo-1');
  const [title, setTitle] = useState('ITS Einsatz');

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
      await reload();
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
        <FormSection title="Importquelle" description="Externe Schichten werden idempotent in die Plattform überführt.">
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
        </FormSection>
        <ActionBar>
          <button type="submit">Shift importieren</button>
        </ActionBar>
      </form>
      {status ? <p className="hint">{status}</p> : null}
      <AsyncState loading={loading} error={error} isEmpty={jobShifts.length === 0} emptyMessage="Noch keine Schichten vorhanden.">
        <div className="record-list">
          {jobShifts.map((shift) => (
            <SectionCard
              key={shift.id}
              title={shift.title ?? 'Pflegeeinsatz'}
              description={shift.locationCity ?? 'ohne Ort'}
              actions={<StatusBadge value={shift.status} />}
            >
              <InfoList
                items={[
                  { label: 'Start', value: new Date(shift.startTime).toLocaleString('de-DE') },
                  { label: 'Ende', value: new Date(shift.endTime).toLocaleString('de-DE') },
                  { label: 'Geplante Stunden', value: shift.totalPlannedHours },
                ]}
              />
            </SectionCard>
          ))}
        </div>
      </AsyncState>
    </section>
  );
}
