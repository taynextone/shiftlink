import { useEffect, useState } from 'react';
import { api, type VerificationOverview } from '../../lib/api';

export function NurseProfilePage() {
  const [verification, setVerification] = useState<VerificationOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getVerificationOverview()
      .then((data) => setVerification(data.verification))
      .catch((err) => setError(err instanceof Error ? err.message : 'Verifikationsstatus konnte nicht geladen werden'));
  }, []);

  return (
    <section className="stack">
      <div className="panel">
        <h1>Profil & Verifikation</h1>
        <p>Die Matching-Freigabe ist eine harte Produktgrenze. Ohne Release keine Sichtbarkeit und keine Offers.</p>
      </div>
      {error ? <p className="hint error">{error}</p> : null}
      {verification ? (
        <article className="panel">
          <p>Freigegeben: <strong>{verification.isReleasedForMatching ? 'Ja' : 'Nein'}</strong></p>
          <p>Released at: {verification.releasedAt ? new Date(verification.releasedAt).toLocaleString('de-DE') : '—'}</p>
          <ul>
            {verification.documents.map((document) => (
              <li key={document.id}>{document.documentType} · {document.status}</li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}
