import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

function computeShiftImportState(shift: { status: string; offerCounts?: { pending: number; signed: number; total: number } }) {
  if (shift.status !== 'OPEN') {
    return { label: 'Import-Update blockiert', reason: 'Nur offene Schichten dürfen per Import aktualisiert werden.' };
  }
  if ((shift.offerCounts?.signed ?? 0) > 0) {
    return { label: 'Import-Update blockiert', reason: 'Signierte Matches sperren Änderungen an importierten Schichten.' };
  }
  if ((shift.offerCounts?.pending ?? 0) > 0) {
    return { label: 'Import-Update blockiert', reason: 'Pending Offers müssen erst geklärt werden, bevor ein Re-Import aktualisieren darf.' };
  }
  return { label: 'Import-Update möglich', reason: 'Kein sichtbarer Backend-Blocker aus Status- oder Offer-Lage.' };
}

export function HospitalShiftsPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const jobShifts = data?.jobShifts ?? [];
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [lastImportFailure, setLastImportFailure] = useState<string | null>(null);
  const [externalJobShiftId, setExternalJobShiftId] = useState('ext-demo-1');
  const [title, setTitle] = useState('ITS Einsatz');
  const [submitting, setSubmitting] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const errors = useMemo(() => ({
    externalJobShiftId: !externalJobShiftId.trim() ? 'Externe ID ist erforderlich' : null,
    title: !title.trim() ? 'Titel ist erforderlich' : null,
  }), [externalJobShiftId, title]);

  const canSubmit = Boolean(externalJobShiftId.trim()) && Boolean(title.trim());

  const selectedShift = useMemo(() => jobShifts.find((s) => s.id === selectedShiftId) ?? null, [jobShifts, selectedShiftId]);

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({ tone: 'error', message: 'Bitte Eingaben korrigieren, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setLastImportFailure(null);
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
      const message = err instanceof Error ? err.message : 'Import fehlgeschlagen';
      setLastImportFailure(message);
      setStatus({ tone: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Schichten & Bedarfseingang"
        description="Operative Bedarfe mit professioneller, zurückhaltender Oberfläche. Keine generische Demo-Tabelle, sondern ein klarer Arbeitskontext für Imports, Statussicht und Interventionslogik."
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
          <InfoList
            items={[
              { label: 'Letzter Import-Blocker', value: lastImportFailure ?? 'kein letzter Fehler gespeichert' },
            ]}
          />
        </FormSection>
        <ActionBar>
          <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Import läuft…' : 'Shift importieren'}</button>
        </ActionBar>
      </form>
      {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}

      <div className="content-grid two-columns-equal">
        <div className="stack">
          <SectionCard title="Schicht-Übersicht" description={`${jobShifts.length} Schichten geladen. Klick auf eine Schicht für Detailansicht und Quick-Actions.`}>
            <div className="record-list compact-list">
              {loading ? <p className="hint">Wird geladen…</p> : null}
              {error ? <p className="hint">Fehler: {String(error)}</p> : null}
              {jobShifts.length === 0 && !loading ? <p className="hint">Noch keine Schichten vorhanden.</p> : null}
              {jobShifts.map((shift) => {
                const importState = computeShiftImportState(shift);
                const isSelected = selectedShiftId === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    className={`panel subpanel${isSelected ? ' selected' : ''}`}
                    style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => setSelectedShiftId(shift.id)}
                  >
                    <div className="section-heading-row">
                      <strong>{shift.title ?? 'Pflegeeinsatz'}</strong>
                      <StatusBadge value={shift.status} />
                    </div>
                    <p>{shift.locationCity ?? 'ohne Ort'} · {new Date(shift.startTime).toLocaleDateString('de-DE')}</p>
                    <p>Offers: {shift.offerCounts?.total ?? 0} total / {shift.offerCounts?.pending ?? 0} pending / {shift.offerCounts?.signed ?? 0} signed</p>
                    <p className="hint">{importState.label}</p>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="stack">
          {selectedShift ? (
            <>
              <SectionCard
                title={selectedShift.title ?? 'Pflegeeinsatz'}
                description={`${selectedShift.locationCity ?? 'ohne Ort'} · ${new Date(selectedShift.startTime).toLocaleString('de-DE')}`}
                actions={<StatusBadge value={selectedShift.status} />}
              >
                <InfoList
                  items={[
                    { label: 'Start', value: new Date(selectedShift.startTime).toLocaleString('de-DE') },
                    { label: 'Ende', value: new Date(selectedShift.endTime).toLocaleString('de-DE') },
                    { label: 'Geplante Stunden', value: selectedShift.totalPlannedHours },
                    { label: 'Offer-Lage', value: `${selectedShift.offerCounts?.total ?? 0} total / ${selectedShift.offerCounts?.pending ?? 0} pending / ${selectedShift.offerCounts?.signed ?? 0} signed` },
                    { label: 'Import-Interventionsstatus', value: computeShiftImportState(selectedShift).label },
                    { label: 'Import-Hinweis', value: computeShiftImportState(selectedShift).reason },
                  ]}
                />
              </SectionCard>
              <SectionCard title="Quick-Actions" description="Direkte Sprungpunkte aus dem Schicht-Kontext.">
                <MetricList
                  items={[
                    { label: 'Offers', value: `${selectedShift.offerCounts?.total ?? 0} gesamt` },
                    { label: 'Pending', value: `${selectedShift.offerCounts?.pending ?? 0} offen` },
                    { label: 'Signed', value: `${selectedShift.offerCounts?.signed ?? 0} abgeschlossen` },
                  ]}
                />
                <ActionBar>
                  <Link to={`/hospital/offers?jobShiftId=${encodeURIComponent(selectedShift.id)}`}>
                    <button type="button" className="secondary">Offers öffnen</button>
                  </Link>
                  <Link to={`/hospital/contracts?jobShiftId=${encodeURIComponent(selectedShift.id)}`}>
                    <button type="button" className="secondary">Contracts öffnen</button>
                  </Link>
                  <Link to={`/hospital/billing`}>
                    <button type="button" className="secondary">Billing öffnen</button>
                  </Link>
                </ActionBar>
              </SectionCard>
            </>
          ) : (
            <SectionCard title="Schicht-Details" description="Wähle eine Schicht aus der Liste, um Details und Quick-Actions zu sehen.">
              <p className="hint">Keine Schicht ausgewählt.</p>
            </SectionCard>
          )}
        </div>
      </div>
    </section>
  );
}
