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

export function NurseAvailabilityPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.listOwnAvailabilityBlocks(), []);
  const blocks = data?.blocks ?? [];
  const [title, setTitle] = useState('Frühdienst verfügbar');
  const [city, setCity] = useState('Berlin');
  const [postalCode, setPostalCode] = useState('10115');
  const [radiusKm, setRadiusKm] = useState('25');
  const [startTime, setStartTime] = useState('2026-06-16T06:00');
  const [endTime, setEndTime] = useState('2026-06-16T18:00');
  const [notes, setNotes] = useState('Einsatz in Berlin Mitte oder angrenzend möglich.');
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const errors = useMemo(() => ({
    city: !city.trim() ? 'Stadt ist erforderlich' : null,
    radiusKm: Number(radiusKm) < 1 ? 'Radius muss mindestens 1 km sein' : null,
    endTime: startTime && endTime && new Date(endTime) <= new Date(startTime) ? 'Ende muss nach dem Start liegen' : null,
  }), [city, endTime, radiusKm, startTime]);

  const canSubmit = Boolean(city.trim()) && Number(radiusKm) >= 1 && !errors.endTime;

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({ tone: 'error', message: 'Bitte Eingaben korrigieren, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      await api.createOwnAvailabilityBlock({
        title: title.trim() || undefined,
        city: city.trim(),
        postalCode: postalCode.trim() || undefined,
        radiusKm: Number(radiusKm),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        notes: notes.trim() || undefined,
      });
      setStatus({ tone: 'success', message: 'Verfügbarkeitsblock angelegt.' });
      await reload();
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Block konnte nicht angelegt werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(blockId: string) {
    setDeletingId(blockId);
    setStatus(null);
    try {
      await api.deleteOwnAvailabilityBlock(blockId);
      setStatus({ tone: 'success', message: 'Verfügbarkeitsblock gelöscht.' });
      await reload();
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Block konnte nicht gelöscht werden' });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Pflegekraft"
        title="Verfügbarkeiten"
        description="Pflegekräfte steuern hier ihre echten Matching-Zeitfenster. Diese Daten fließen direkt in Kandidatensuche und Offer-Fähigkeit ein."
      />
      <div className="content-grid master-detail-grid">
        <SectionCard title="Bestehende Blöcke" description="Aktive Verfügbarkeiten werden chronologisch und mit Buchungsstatus dargestellt.">
          <AsyncState loading={loading} error={error} isEmpty={blocks.length === 0} emptyMessage="Noch keine Verfügbarkeitsblöcke vorhanden.">
            <div className="selection-list">
              {blocks.map((block) => {
                const pendingDelete = deletingId === block.id;
                return (
                  <SectionCard
                    key={block.id}
                    title={block.title ?? 'Verfügbarkeit'}
                    description={`${block.city} · ${new Date(block.startTime).toLocaleString('de-DE')}`}
                    actions={<StatusBadge value={block.isBooked ? 'booked' : 'open'} />}
                  >
                    <InfoList
                      items={[
                        { label: 'Zeitraum', value: `${new Date(block.startTime).toLocaleString('de-DE')} → ${new Date(block.endTime).toLocaleString('de-DE')}` },
                        { label: 'Radius', value: `${block.radiusKm} km` },
                        { label: 'PLZ', value: block.postalCode ?? '—' },
                      ]}
                    />
                    <ActionBar>
                      <button className="secondary" disabled={pendingDelete || block.isBooked} onClick={() => void handleDelete(block.id)}>
                        {pendingDelete ? 'Lösche…' : 'Löschen'}
                      </button>
                    </ActionBar>
                  </SectionCard>
                );
              })}
            </div>
          </AsyncState>
        </SectionCard>

        <div className="stack">
          <form className="panel form-panel stack" onSubmit={handleCreate}>
            <FormSection title="Neuen Verfügbarkeitsblock anlegen" description="Diese Eingaben definieren ein echtes Matching-Zeitfenster für die Kandidatensuche.">
              <div className="form-grid two">
                <Field label="Titel" helpText="Kurze interne Beschreibung des Fensters.">
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titel" />
                </Field>
                <Field label="Stadt" error={errors.city}>
                  <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Stadt" />
                </Field>
              </div>
              <div className="form-grid two">
                <Field label="PLZ">
                  <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="PLZ" />
                </Field>
                <Field label="Radius (km)" error={errors.radiusKm}>
                  <input value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)} placeholder="25" type="number" min="1" />
                </Field>
              </div>
              <div className="form-grid two">
                <Field label="Startzeit">
                  <input value={startTime} onChange={(event) => setStartTime(event.target.value)} type="datetime-local" />
                </Field>
                <Field label="Endzeit" error={errors.endTime}>
                  <input value={endTime} onChange={(event) => setEndTime(event.target.value)} type="datetime-local" />
                </Field>
              </div>
              <Field label="Notizen" helpText="Optionaler Kontext für Einsatzwünsche oder Einschränkungen.">
                <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notizen" />
              </Field>
              <MetricList
                items={[
                  { label: 'Blöcke gesamt', value: blocks.length },
                  { label: 'Gebucht', value: blocks.filter((block) => block.isBooked).length },
                ]}
              />
            </FormSection>
            <ActionBar>
              <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Speichert…' : 'Block anlegen'}</button>
            </ActionBar>
          </form>
          {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
        </div>
      </div>
    </section>
  );
}
