import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ActionBar } from '../../components/ActionBar';
import { AsyncState } from '../../components/AsyncState';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { FormSection } from '../../components/FormSection';
import { InfoList } from '../../components/InfoList';
import { MetricList } from '../../components/MetricList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api, type Candidate, type HospitalJobShift, type HospitalOffer } from '../../lib/api';

import { computeOfferHealth } from './ops-helpers';
import { getInvoiceBillingPath } from './billing-helpers';

export function HospitalOffersPage() {
  const [searchParams] = useSearchParams();
  const focusNurseProfileId = searchParams.get('focusNurseProfileId') ?? '';
  const focusContractId = searchParams.get('focusContractId') ?? '';
  const initialJobShiftId = searchParams.get('jobShiftId') ?? '';
  const { data: shiftData, loading: shiftsLoading, error: shiftsError } = useAsyncData(() => api.listHospitalJobShifts(), []);
  const availableShifts = shiftData?.jobShifts ?? [];
  const [jobShiftId, setJobShiftId] = useState(initialJobShiftId);
  const [offers, setOffers] = useState<HospitalOffer[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeShift, setActiveShift] = useState<HospitalJobShift | null>(null);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [lastOfferFailure, setLastOfferFailure] = useState<{ nurseProfileId: string; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { title: string; message: string; tone: 'danger' | 'warning' | 'neutral'; onConfirm: () => void | Promise<void> }>(null);
  const [expandedCommId, setExpandedCommId] = useState<string | null>(null);
  const [commEvents, setCommEvents] = useState<Record<string, Array<{ id: string; eventType: string; phoneNumber: string; messageText: string; status: string; attemptCount: number; lastError: string | null; deliveredAt: string | null; createdAt: string; updatedAt: string }>>>({});
  const [commLoading, setCommLoading] = useState<Record<string, boolean>>({});

  const selectedShift = useMemo(
    () => availableShifts.find((shift) => shift.id === jobShiftId) ?? activeShift,
    [availableShifts, activeShift, jobShiftId],
  );

  const focusedOffers = focusNurseProfileId ? offers.filter((offer) => offer.nurseProfileId === focusNurseProfileId) : offers;
  const focusedCandidates = focusNurseProfileId ? candidates.filter((candidate) => candidate.nurseProfileId === focusNurseProfileId) : candidates;

  const offerSummary = useMemo(() => {
    return focusedOffers.reduce(
      (acc, offer) => {
        acc.total += 1;
        acc[offer.status] = (acc[offer.status] ?? 0) + 1;
        if (offer.invoiceId) {
          acc.invoiced += 1;
        }
        return acc;
      },
      { total: 0, invoiced: 0 } as Record<string, number>,
    );
  }, [focusedOffers]);

  function normalizeOffers(inputOffers: HospitalOffer[], shift: HospitalJobShift) {
    return (inputOffers ?? []).map((offer) => ({
      ...offer,
      nurseProfileId: offer.nurseProfileId ?? offer.nurse.id,
      jobShiftId: shift.id,
    }));
  }

  async function loadOffers(targetShiftId: string) {
    const result = await api.listHospitalOffers(targetShiftId);
    setOffers(normalizeOffers(result.offers ?? [], result.jobShift));
    setActiveShift(result.jobShift);
    setStatus({ tone: 'success', message: `Offers für ${result.jobShift.title ?? result.jobShift.id} geladen.` });
  }

  async function handleLoadOffers(event: React.FormEvent) {
    event.preventDefault();
    if (!jobShiftId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst eine Schicht auswählen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      await loadOffers(jobShiftId);
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Offers konnten nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadCandidates() {
    if (!jobShiftId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst eine Schicht auswählen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const result = await api.findCandidates(jobShiftId);
      setCandidates(result.candidates ?? []);
      setStatus({ tone: 'success', message: 'Kandidaten geladen.' });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Kandidaten konnten nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  function handleRespondToOffer(matchContractId: string, action: 'ACCEPT' | 'DECLINE') {
    const actionLabel = action === 'ACCEPT' ? 'annehmen' : 'ablehnen';
    setConfirmAction({
      title: `Offer ${actionLabel}`,
      message: action === 'ACCEPT'
        ? `Offer wirklich annehmen?\n\nContract: ${matchContractId}`
        : `Offer wirklich ablehnen?\n\nContract: ${matchContractId}\n\nNurse-Offer wird beendet. Ggf. neue Schicht oder Reopen prüfen.`,
      tone: action === 'ACCEPT' ? 'warning' : 'danger',
      onConfirm: async () => {
        setConfirmAction(null);
        setSubmitting(true);
        setStatus(null);
        try {
          const result = await api.respondToMatchOffer({ matchContractId, action });
          const doneLabel = action === 'ACCEPT' ? 'angenommen' : 'abgelehnt';
          const nextStep = action === 'ACCEPT'
            ? 'Vertragskontext prüfen.'
            : 'Nurse-Offer beendet. Ggf. neue Schicht oder Reopen prüfen.';
          setOffers((prev) => prev.map((offer) => offer.id === matchContractId ? { ...offer, ...result.matchContract } : offer));
          setStatus({ tone: 'success', message: `Offer ${doneLabel}. ${nextStep}` });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Offer-Antwort fehlgeschlagen';
          setStatus({ tone: 'error', message });
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  async function handleToggleComm(offerId: string) {
    if (expandedCommId === offerId) {
      setExpandedCommId(null);
      return;
    }
    setExpandedCommId(offerId);
    if (commEvents[offerId]) return;
    setCommLoading((prev) => ({ ...prev, [offerId]: true }));
    try {
      const result = await api.getWhatsAppEvents(offerId);
      setCommEvents((prev) => ({ ...prev, [offerId]: result.events }));
    } catch {
      setCommEvents((prev) => ({ ...prev, [offerId]: [] }));
    } finally {
      setCommLoading((prev) => ({ ...prev, [offerId]: false }));
    }
  }

  function handleExtendOfferExpiry(matchContractId: string) {
    setConfirmAction({
      title: 'Offer verlängern',
      message: `Abgelaufenes Offer verlängern?\n\nContract: ${matchContractId}\n\nDas Offer wird auf PENDING gesetzt und ein neues Ablaufdatum erhält.`,
      tone: 'warning',
      onConfirm: async () => {
        setConfirmAction(null);
        setSubmitting(true);
        setStatus(null);
        try {
          const result = await api.extendOfferExpiry({ matchContractId });
          setOffers((prev) => prev.map((offer) => offer.id === matchContractId ? { ...offer, ...result.matchContract } : offer));
          setStatus({ tone: 'success', message: `Offer verlängert: ${result.matchContract.id}. Neues Ablaufdatum gesetzt.` });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Offer-Verlängerung fehlgeschlagen';
          setStatus({ tone: 'error', message });
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  function handleReopenOffer(matchContractId: string) {
    setConfirmAction({
      title: 'Offer erneut öffnen',
      message: `Offer wirklich erneut öffnen?\n\nContract: ${matchContractId}\n\nBei Opt-in wird die WhatsApp-Kommunikation erneut angestoßen.`,
      tone: 'warning',
      onConfirm: async () => {
        setConfirmAction(null);
        setSubmitting(true);
        setStatus(null);
        try {
          const result = await api.reopenOffer({ matchContractId });
          setOffers((prev) => prev.map((offer) => offer.id === matchContractId ? { ...offer, ...result.matchContract } : offer));
          setStatus({ tone: 'success', message: `Offer erneut geöffnet: ${result.matchContract.id}. Kommunikation wurde ggf. neu angestoßen.` });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Offer-Reopen fehlgeschlagen';
          setStatus({ tone: 'error', message });
        } finally {
          setSubmitting(false);
        }
      },
    });
  }

  useEffect(() => {
    if (!initialJobShiftId) {
      return;
    }
    setJobShiftId(initialJobShiftId);
    setSubmitting(true);
    setStatus(null);
    void loadOffers(initialJobShiftId)
      .catch((err) => {
        setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Offers konnten nicht geladen werden' });
      })
      .finally(() => setSubmitting(false));
  }, [initialJobShiftId]);

  useEffect(() => {
    if (!focusContractId) {
      return;
    }
    void handleToggleComm(focusContractId);
  }, [focusContractId]);

  async function handleCreateOffer(nurseProfileId: string) {
    if (!jobShiftId) {
      setStatus({ tone: 'error', message: 'Bitte zuerst eine Schicht auswählen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setLastOfferFailure(null);
    try {
      const result = await api.createOffer({ jobShiftId, nurseProfileId });
      if (activeShift) {
        setOffers((prev) => normalizeOffers([...prev, result.matchContract as HospitalOffer], activeShift));
      } else {
        await loadOffers(jobShiftId);
      }
      setStatus({ tone: 'success', message: `Offer erstellt: ${result.matchContract.id}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Offer konnte nicht erstellt werden';
      setLastOfferFailure({ nurseProfileId, message });
      setStatus({ tone: 'error', message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Offers & Kandidatensteuerung"
        description="Professionelle Arbeitsfläche für Kandidatensuche und Angebotsauslösung. Fokus auf belastbare operative Schritte statt visuellem Spielzeug."
      />
      <div className="content-grid master-detail-grid">
        <SectionCard title="Schichten" description="Wähle einen vorhandenen Bedarf als Arbeitskontext für Offers und Kandidaten.">
          <AsyncState loading={shiftsLoading} error={shiftsError} isEmpty={availableShifts.length === 0} emptyMessage="Noch keine Schichten vorhanden.">
            <div className="selection-list">
              {availableShifts.map((shift) => {
                const selected = jobShiftId === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    className={selected ? 'selection-card active' : 'selection-card'}
                    onClick={() => setJobShiftId(shift.id)}
                  >
                    <div>
                      <strong>{shift.title ?? 'Pflegeeinsatz'}</strong>
                      <p>{shift.locationCity ?? 'ohne Ort'}</p>
                    </div>
                    <StatusBadge value={shift.status} />
                  </button>
                );
              })}
            </div>
          </AsyncState>
        </SectionCard>

        <div className="stack">
          <form className="panel form-panel stack" onSubmit={handleLoadOffers}>
            <FormSection title="Operativer Kontext" description="Die ausgewählte Schicht steuert Kandidatensuche und Offer-Liste in einem gemeinsamen Arbeitsraum.">
              <label>
                <span>Job Shift auswählen</span>
                <select value={jobShiftId} onChange={(event) => setJobShiftId(event.target.value)}>
                  <option value="">— Shift auswählen —</option>
                  {availableShifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.title ?? 'Pflegeeinsatz'} · {shift.locationCity ?? 'ohne Ort'} · {new Date(shift.startTime).toLocaleDateString('de-DE')}
                    </option>
                  ))}
                </select>
              </label>
              {focusNurseProfileId ? <p className="hint">Gefiltert auf Nurse Profile ID: {focusNurseProfileId}</p> : null}
              {selectedShift ? (
                <>
                  <InfoList
                    items={[
                      { label: 'Titel', value: selectedShift.title ?? 'Pflegeeinsatz' },
                      { label: 'Ort', value: selectedShift.locationCity ?? '—' },
                      { label: 'Start', value: new Date(selectedShift.startTime).toLocaleString('de-DE') },
                      { label: 'Ende', value: new Date(selectedShift.endTime).toLocaleString('de-DE') },
                    ]}
                  />
                  <MetricList
                    items={[
                      { label: 'Offers gesamt', value: offerSummary.total },
                      { label: 'Pending', value: offerSummary.PENDING ?? 0 },
                      { label: 'Signed', value: offerSummary.SIGNED ?? 0 },
                      { label: 'Declined', value: offerSummary.DECLINED ?? 0 },
                      { label: 'Expired', value: offerSummary.EXPIRED ?? 0 },
                      { label: 'Invoiced', value: offerSummary.invoiced },
                    ]}
                  />
                  <ol className="ordered-list compact-ordered-list">
                    <li>Pending Offers zuerst beantworten oder sauber nachhalten</li>
                    <li>Signed Offers direkt in Contract- und Dossier-Kontext weiterführen</li>
                    <li>Declined / Expired Offers nur noch für Reopen- oder Historienentscheidungen prüfen</li>
                  </ol>
                </>
              ) : null}
            </FormSection>
            <ActionBar>
              <button type="submit" disabled={submitting || !jobShiftId}>{submitting ? 'Lädt…' : 'Offers laden'}</button>
              <button type="button" className="secondary" disabled={submitting || !jobShiftId} onClick={() => void handleLoadCandidates()}>
                {submitting ? 'Bitte warten…' : 'Kandidaten suchen'}
              </button>
            </ActionBar>
          </form>

          {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}

          <div className="content-grid two-columns-equal">
            <section className="stack">
              <div className="section-heading-row">
                <h2 className="section-heading">Kandidaten</h2>
                <StatusBadge value={`${focusedCandidates.length} profile`} />
              </div>
              {focusedCandidates.map((candidate) => {
                const candidateFailure = lastOfferFailure?.nurseProfileId === candidate.nurseProfileId ? lastOfferFailure.message : null;
                return (
                  <SectionCard
                    key={candidate.nurseProfileId}
                    title={candidate.displayName}
                    description={`${candidate.publicId} · ${candidate.matchingCity}`}
                    actions={<StatusBadge value={candidate.preferredShiftType} />}
                  >
                    <InfoList
                      items={[
                        { label: 'Nurse Profile ID', value: candidate.nurseProfileId },
                        { label: 'Min. Rate', value: `${candidate.minHourlyRate} €` },
                        { label: 'Match-Fit', value: candidate.preferredTagMatches },
                        { label: 'Availability Block', value: candidate.matchingAvailabilityBlockId },
                        { label: 'Letzter Offer-Blocker', value: candidateFailure ?? 'kein letzter Fehler gespeichert' },
                      ]}
                    />
                    <ActionBar>
                      <Link to={`/hospital/dossier?nurseProfileId=${encodeURIComponent(candidate.nurseProfileId)}`}>Dossier öffnen</Link>
                      <button disabled={submitting} onClick={() => void handleCreateOffer(candidate.nurseProfileId)}>
                        {submitting ? 'Bitte warten…' : 'Offer erstellen'}
                      </button>
                    </ActionBar>
                  </SectionCard>
                );
              })}
              {focusedCandidates.length === 0 ? <div className="panel empty">Noch keine Kandidaten geladen.</div> : null}
            </section>
            <section className="stack">
              <div className="section-heading-row">
                <h2 className="section-heading">Offers</h2>
                <StatusBadge value={`${focusedOffers.length} active`} />
              </div>
              {focusedOffers.map((offer) => {
                const health = computeOfferHealth(offer);
                return (
                  <SectionCard
                    key={offer.id}
                    title={offer.nurse.displayName}
                    description={`${offer.nurse.publicId} · ${health.label}`}
                    actions={<StatusBadge value={offer.status} />}
                  >
                    <InfoList
                      items={[
                        { label: 'Offer ID', value: offer.id },
                        { label: 'Nurse Profile ID', value: offer.nurseProfileId ?? '—' },
                        { label: 'Min. Rate', value: `${offer.nurse.minHourlyRate} €` },
                        { label: 'Nächster Schritt', value: health.nextAction },
                        { label: 'Exception-Hinweis', value: health.exceptionNote },
                        { label: 'Kommunikation', value: offer.nurse.whatsappOptIn ? 'WhatsApp Opt-in aktiv' : 'kein WhatsApp Opt-in' },
                        { label: 'Expires At', value: offer.expiresAt ? new Date(offer.expiresAt).toLocaleString('de-DE') : '—' },
                        { label: 'Responded At', value: offer.respondedAt ? new Date(offer.respondedAt).toLocaleString('de-DE') : '—' },
                        { label: 'Signed At', value: offer.signedAt ? new Date(offer.signedAt).toLocaleString('de-DE') : '—' },
                        { label: 'Invoice', value: offer.invoiceId ?? 'noch keine Rechnung' },
                      ]}
                    />
                    <ActionBar>
                      {offer.nurseProfileId ? <Link to={`/hospital/dossier?nurseProfileId=${encodeURIComponent(offer.nurseProfileId)}&contractId=${encodeURIComponent(offer.id)}`}>Dossier öffnen</Link> : null}
                      <Link to={`/hospital/contracts?contractId=${encodeURIComponent(offer.id)}`}>Contract öffnen</Link>
                      {offer.invoiceId ? <Link to={getInvoiceBillingPath(offer.invoiceId)}>Invoice öffnen</Link> : null}
                      {offer.status === 'PENDING' ? (
                        <>
                          <button disabled={submitting} onClick={() => void handleRespondToOffer(offer.id, 'ACCEPT')}>
                            {submitting ? '…' : 'Offer annehmen'}
                          </button>
                          <button className="secondary" disabled={submitting} onClick={() => void handleRespondToOffer(offer.id, 'DECLINE')}>
                            {submitting ? '…' : 'Offer ablehnen'}
                          </button>
                        </>
                      ) : null}
                      {offer.status === 'DECLINED' || offer.status === 'EXPIRED' ? (
                        <button className="secondary" disabled={submitting} onClick={() => void handleReopenOffer(offer.id)}>
                          {submitting ? '…' : 'Offer erneut öffnen'}
                        </button>
                      ) : null}
                      {offer.status === 'EXPIRED' ? (
                        <button className="secondary" disabled={submitting} onClick={() => void handleExtendOfferExpiry(offer.id)}>
                          {submitting ? '…' : 'Offer verlängern'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="secondary"
                        disabled={commLoading[offer.id] || !offer.nurse.whatsappOptIn}
                        onClick={() => void handleToggleComm(offer.id)}
                      >
                        {!offer.nurse.whatsappOptIn ? 'Kein WhatsApp Opt-in' : commLoading[offer.id] ? '…' : expandedCommId === offer.id ? 'Kommunikation ausblenden' : 'Kommunikation anzeigen'}
                      </button>
                    </ActionBar>
                    {expandedCommId === offer.id ? (
                      <div style={{ marginTop: '0.75rem' }}>
                        <strong>Kommunikationsverlauf</strong>
                        {!commEvents[offer.id] ? (
                          <p className="hint">Wird geladen…</p>
                        ) : commEvents[offer.id].length === 0 ? (
                          <p className="hint">Keine Kommunikationsereignisse gefunden.</p>
                        ) : (
                          <div className="record-list compact-list" style={{ marginTop: '0.5rem' }}>
                            {commEvents[offer.id].map((evt) => (
                              <div className="panel subpanel" key={evt.id}>
                                <div className="section-heading-row">
                                  <strong>{evt.eventType}</strong>
                                  <StatusBadge value={evt.status} />
                                </div>
                                <p>Telefon: {evt.phoneNumber}</p>
                                <p>Versuche: {evt.attemptCount}</p>
                                {evt.deliveredAt ? <p>Zugestellt: {new Date(evt.deliveredAt).toLocaleString('de-DE')}</p> : null}
                                {evt.lastError ? <p>Fehler: {evt.lastError}</p> : null}
                                <p>Erstellt: {new Date(evt.createdAt).toLocaleString('de-DE')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </SectionCard>
                );
              })}
              {focusedOffers.length === 0 ? <div className="panel empty">Noch keine Offers geladen.</div> : null}
            </section>
          </div>
        </div>
      </div>
      {confirmAction ? (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel="Bestätigen"
          cancelLabel="Abbrechen"
          tone={confirmAction.tone}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      ) : null}
    </section>
  );
}
