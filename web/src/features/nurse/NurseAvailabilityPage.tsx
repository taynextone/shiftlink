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
import { api, type AvailabilityBlock } from '../../lib/api';

function toLocalInput(value: string) {
  return value.slice(0, 16);
}

export function NurseAvailabilityPage() {
  const { data, loading, error, reload } = useAsyncData(() => api.listOwnAvailabilityBlocks(), []);
  const blocks = data?.blocks ?? [];
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);
  const [title, setTitle] = useState('Frühdienst verfügbar');
  const [city, setCity] = useState('Berlin');
  const [postalCode, setPostalCode] = useState('10115');
  const [radiusKm, setRadiusKm] = useState('25');
  const [startTime, setStartTime] = useState('2026-06-16T06:00');
  const [endTime, setEndTime] = useState('2026-06-16T18:00');
  const [notes, setNotes] = useState('Einsatz in Berlin Mitte oder angrenzend möglich.');
  const [copySourceId, setCopySourceId] = useState('');
  const [copyStartTime, setCopyStartTime] = useState('2026-06-17T06:00');
  const [copyEndTime, setCopyEndTime] = useState('2026-06-17T18:00');
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const errors = useMemo(() => ({
    city: !city.trim() ? 'Stadt ist erforderlich' : null,
    radiusKm: Number(radiusKm) < 1 ? 'Radius muss mindestens 1 km sein' : null,
    endTime: startTime && endTime && new Date(endTime) <= new Date(startTime) ? 'Ende muss nach dem Start liegen' : null,
    copyEndTime: copyStartTime && copyEndTime && new Date(copyEndTime) <= new Date(copyStartTime) ? 'Kopie-Ende muss nach dem Start liegen' : null,
  }), [city, copyEndTime, copyStartTime, endTime, radiusKm, startTime]);

  const canSubmit = Boolean(city.trim()) && Number(radiusKm) >= 1 && !errors.endTime;
  const canCopy = Boolean(copySourceId) && !errors.copyEndTime;

  function resetForm() {
    setEditingBlock(null);
    setTitle('Frühdienst verfügbar');
    setCity('Berlin');
    setPostalCode('10115');
    setRadiusKm('25');
    setStartTime('2026-06-16T06:00');
    setEndTime('2026-06-16T18:00');
    setNotes('Einsatz in Berlin Mitte oder angrenzend möglich.');
  }

  function loadIntoForm(block: AvailabilityBlock) {
    setEditingBlock(block);
    setTitle(block.title ?? 'Verfügbarkeit');
    setCity(block.city);
    setPostalCode(block.postalCode ?? '');
    setRadiusKm(String(block.radiusKm));
    setStartTime(toLocalInput(block.startTime));
    setEndTime(toLocalInput(block.endTime));
    setNotes(block.notes ?? '');
  }

  async function handleCreateOrUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) {
      setStatus({ tone: 'error', message: 'Bitte Eingaben korrigieren, bevor du fortfährst.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    const payload = {
      title: title.trim() || undefined,
      city: city.trim(),
      postalCode: postalCode.trim() || undefined,
      radiusKm: Number(radiusKm),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes.trim() || undefined,
    };

    try {
      if (editingBlock) {
        await api.updateOwnAvailabilityBlock(editingBlock.id, payload);
        setStatus({ tone: 'success', message: 'Verfügbarkeitsblock aktualisiert.' });
      } else {
        await api.createOwnAvailabilityBlock(payload);
        setStatus({ tone: 'success', message: 'Verfügbarkeitsblock angelegt.' });
      }
      resetForm();
      await reload();
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Aktion fehlgeschlagen' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!canCopy) {
      setStatus({ tone: 'error', message: 'Bitte einen gültigen Kopierzeitraum angeben.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      await api.copyOwnAvailabilityBlock({
        sourceBlockId: copySourceId,
        copies: [{
          startTime: new Date(copyStartTime).toISOString(),
          endTime: new Date(copyEndTime).toISOString(),
        }],
      });
      setStatus({ tone: 'success', message: 'Verfügbarkeitsblock kopiert.' });
      await reload();
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Block konnte nicht kopiert werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplaceWithCurrent() {
    if (blocks.length === 0) {
      setStatus({ tone: 'error', message: 'Es gibt keine Blöcke zum Ersetzen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      await api.replaceOwnAvailabilityBlocks({
        blocks: blocks.filter((block) => !block.isBooked).map((block) => ({
          title: block.title ?? undefined,
          city: block.city,
          postalCode: block.postalCode ?? undefined,
          radiusKm: block.radiusKm,
          startTime: block.startTime,
          endTime: block.endTime,
          notes: block.notes ?? undefined,
        })),
      });
      setStatus({ tone: 'success', message: 'Verfügbarkeitsblöcke neu geschrieben.' });
      await reload();
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Blocks konnten nicht ersetzt werden' });
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
                      <button className="secondary" disabled={block.isBooked || submitting} onClick={() => loadIntoForm(block)}>Bearbeiten</button>
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
          <form className="panel form-panel stack" onSubmit={handleCreateOrUpdate}>
            <FormSection title={editingBlock ? 'Verfügbarkeitsblock bearbeiten' : 'Neuen Verfügbarkeitsblock anlegen'} description="Diese Eingaben definieren ein echtes Matching-Zeitfenster für die Kandidatensuche.">
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
              <button type="submit" disabled={submitting || !canSubmit}>{submitting ? 'Speichert…' : editingBlock ? 'Block speichern' : 'Block anlegen'}</button>
              {editingBlock ? <button type="button" className="secondary" onClick={resetForm}>Abbrechen</button> : null}
            </ActionBar>
          </form>

          <SectionCard title="Kopieren & Replace" description="Vorhandene Blöcke können für neue Zeiträume dupliziert oder als aktueller Satz neu geschrieben werden.">
            <FormSection title="Block kopieren" description="Nimmt einen bestehenden Block als Vorlage und erzeugt einen neuen Zeitraum.">
              <Field label="Quelle">
                <select value={copySourceId} onChange={(event) => setCopySourceId(event.target.value)}>
                  <option value="">Bitte wählen</option>
                  {blocks.map((block) => (
                    <option key={block.id} value={block.id}>{block.title ?? 'Verfügbarkeit'} · {new Date(block.startTime).toLocaleDateString('de-DE')}</option>
                  ))}
                </select>
              </Field>
              <div className="form-grid two">
                <Field label="Kopie Startzeit">
                  <input value={copyStartTime} onChange={(event) => setCopyStartTime(event.target.value)} type="datetime-local" />
                </Field>
                <Field label="Kopie Endzeit" error={errors.copyEndTime}>
                  <input value={copyEndTime} onChange={(event) => setCopyEndTime(event.target.value)} type="datetime-local" />
                </Field>
              </div>
              <ActionBar>
                <button type="button" disabled={submitting || !canCopy} onClick={() => void handleCopy()}>{submitting ? 'Bitte warten…' : 'Block kopieren'}</button>
              </ActionBar>
            </FormSection>
            <FormSection title="Replace-Satz" description="Schreibt den aktuellen ungebuchten Satz als neuen Availability-Stand zurück ins Backend.">
              <ActionBar>
                <button type="button" className="secondary" disabled={submitting || blocks.length === 0} onClick={() => void handleReplaceWithCurrent()}>
                  {submitting ? 'Bitte warten…' : 'Aktuellen Satz neu schreiben'}
                </button>
              </ActionBar>
            </FormSection>
          </SectionCard>

          {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
        </div>
      </div>
    </section>
  );
}
