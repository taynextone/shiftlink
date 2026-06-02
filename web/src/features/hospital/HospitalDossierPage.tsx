import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ActionBar } from '../../components/ActionBar';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { Field } from '../../components/Field';
import { InfoList } from '../../components/InfoList';
import { PageHeader } from '../../components/PageHeader';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { api, type HospitalNurseDossier } from '../../lib/api';
import { DossierOverview } from './DossierOverview';

export function HospitalDossierPage() {
  const [searchParams] = useSearchParams();
  const initialNurseProfileId = searchParams.get('nurseProfileId') ?? '';
  const initialContractId = searchParams.get('contractId') ?? '';
  const [nurseProfileId, setNurseProfileId] = useState(initialNurseProfileId);
  const [dossier, setDossier] = useState<HospitalNurseDossier | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadDossier(targetNurseProfileId: string) {
    const response = await api.getHospitalNurseDossier(targetNurseProfileId.trim());
    setDossier(response.dossier);
    setFeedback({ tone: 'success', message: 'Dossier geladen.' });
  }

  useEffect(() => {
    if (!initialNurseProfileId) {
      return;
    }
    setNurseProfileId(initialNurseProfileId);
    setSubmitting(true);
    setFeedback(null);
    void loadDossier(initialNurseProfileId)
      .catch((error) => {
        setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Dossier konnte nicht geladen werden' });
      })
      .finally(() => setSubmitting(false));
  }, [initialNurseProfileId]);

  async function handleLoad(event: React.FormEvent) {
    event.preventDefault();
    if (!nurseProfileId.trim()) {
      setFeedback({ tone: 'error', message: 'Bitte eine Nurse Profile ID angeben.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await loadDossier(nurseProfileId);
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Dossier konnte nicht geladen werden' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack page-stack">
      <PageHeader
        eyebrow="Krankenhaus"
        title="Nurse Dossier Access"
        description="Geschützter Hospital-Zugriff auf verifizierte Dossierdaten bereits signierter Pflegekräfte. Der Flow kann direkt aus Offers und Contracts angesprungen werden."
      />
      <form className="panel form-panel stack" onSubmit={handleLoad}>
        <Field label="Nurse Profile ID" helpText="Nur zulässig, wenn bereits eine signierte Beziehung zwischen Krankenhaus und Pflegekraft besteht.">
          <input value={nurseProfileId} onChange={(event) => setNurseProfileId(event.target.value)} placeholder="nurseProfileId" />
        </Field>
        {initialContractId ? <p className="hint">Geöffnet aus Contract-Kontext: {initialContractId}</p> : null}
        <ActionBar>
          <button type="submit" disabled={submitting}>{submitting ? 'Lädt…' : 'Dossier laden'}</button>
        </ActionBar>
      </form>
      {feedback ? <FeedbackMessage tone={feedback.tone} message={feedback.message} /> : null}
      {!dossier ? <DossierOverview /> : null}
      {dossier ? (
        <div className="content-grid two-columns-equal">
          <SectionCard
            title="Nurse Overview"
            description="Freigegebene Stammdaten und Matching-Kontext."
            actions={<Link to={`/hospital/offers?focusNurseProfileId=${encodeURIComponent(dossier.nurseProfileId)}`}>Zu Offers</Link>}
          >
            <div className="summary-grid">
              <div className="summary-card">
                <span>Release</span>
                <StatusBadge value={dossier.isReleasedForMatching ? 'released' : 'pending'} />
              </div>
              <div className="summary-card">
                <span>Shift Type</span>
                <StatusBadge value={dossier.preferredShiftType ?? 'unspecified'} />
              </div>
            </div>
            <InfoList
              items={[
                { label: 'Profile ID', value: dossier.nurseProfileId },
                { label: 'Public ID', value: dossier.publicId },
                { label: 'Name', value: `${dossier.firstName ?? ''} ${dossier.lastName ?? ''}`.trim() || dossier.displayName },
                { label: 'Display Name', value: dossier.displayName },
                { label: 'Phone', value: dossier.phoneNumber ?? '—' },
                { label: 'Hourly Rate', value: `${dossier.minHourlyRate} €` },
                { label: 'Released At', value: dossier.releasedAt ? new Date(dossier.releasedAt).toLocaleString('de-DE') : '—' },
                { label: 'Verified Documents', value: dossier.verifiedDocuments.length },
                { label: 'Signed Assignments', value: dossier.signedAssignments.length },
                { label: 'Specializations', value: dossier.specializations.join(', ') || '—' },
              ]}
            />
          </SectionCard>

          <SectionCard title="Verified Documents" description="Nur bereits verifizierte Dokumente mit signierten Download-Links.">
            <div className="record-list compact-list">
              {dossier.verifiedDocuments.map((document) => (
                <div className="panel subpanel" key={document.id}>
                  <strong>{document.documentType}</strong>
                  <p>{document.objectKey}</p>
                  <p>Status: {document.status}</p>
                  <p>Reviewed: {document.reviewedAt ? new Date(document.reviewedAt).toLocaleString('de-DE') : '—'}</p>
                  <p>Download läuft in {document.expiresIn} s ab</p>
                  <a href={document.signedUrl} target="_blank" rel="noreferrer">Download öffnen</a>
                </div>
              ))}
              {dossier.verifiedDocuments.length === 0 ? <p className="hint">Keine verifizierten Dokumente verfügbar.</p> : null}
            </div>
          </SectionCard>

          <SectionCard title="Signed Assignments" description="Historie der signierten Einsätze mit diesem Nurse-Profil.">
            <div className="record-list compact-list">
              {dossier.signedAssignments.map((assignment) => (
                <div className="panel subpanel" key={assignment.matchContractId}>
                  <strong>{assignment.clinicName}</strong>
                  <p>{assignment.locationCity ?? 'ohne Ort'}</p>
                  <p>{new Date(assignment.startTime).toLocaleString('de-DE')} → {new Date(assignment.endTime).toLocaleString('de-DE')}</p>
                  <ActionBar>
                    <Link to={`/hospital/contracts?contractId=${encodeURIComponent(assignment.matchContractId)}`}>Contract öffnen</Link>
                  </ActionBar>
                </div>
              ))}
              {dossier.signedAssignments.length === 0 ? <p className="hint">Keine signierten Einsätze verfügbar.</p> : null}
            </div>
          </SectionCard>
        </div>
      ) : null}
    </section>
  );
}
