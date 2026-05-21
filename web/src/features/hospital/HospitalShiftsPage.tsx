import { useMemo, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
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
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [externalJobShiftId, setExternalJobShiftId] = useState('ext-demo-1');
  const [title, setTitle] = useState('ITS Einsatz');
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => ({
    externalJobShiftId: !externalJobShiftId.trim() ? 'Externe ID ist erforderlich' : null,
    title: !title.trim() ? 'Titel ist erforderlich' : null,
  }), [externalJobShiftId, title]);

  const canSubmit = Boolean(externalJobShiftId.trim()) && Boolean(title.trim());

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({ tone: 'error', message: 'Bitte Eingaben korrigieren, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.importHospitalJobShift({
        externalJobShiftId: externalJobShiftId.trim(),
        title: title.trim(),
        locationCity: 'Berlin',
        startTime: '2026-06-16T06:00:00.000Z',
        endTime: '2026-06-20T18:00:00.000Z',
        totalPlannedHours: 12,
        requirements: [{ tag: 'Intensivstation', priority: 'REQUIRED' }],
      });
      setStatus({ tone: 'success', message: `Import ${result.mode === 'created' ? 'angelegt' : 'aktualisiert'}.` });
      await reload();
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Import fehlgeschlagen' });
    } finally {
      setSubmitting(false);
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
            <Field label="External Job Shift ID" helpText="Stabile Quell-ID für idempotente Re-Imports." error={errors.externalJobShiftId}>
              <input value={externalJobShiftId} onChange={(event) => setExternalJobShiftId(event.target.value)} placeholder="externalJobShiftId" />
            </Field>
            <Field label="Titel" helpText="Interne Bezeichnung des Bedarfs." error={errors.title}>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" />
            </Field>
          </div>
        </FormSection>
        <ActionBar>
          <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Import läuft…' : 'Shift importieren'}</button>
        </ActionBar>
      </form>
      {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
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
