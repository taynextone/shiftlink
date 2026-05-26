import { useState, useRef } from 'react';
import { SectionCard } from '../../components/SectionCard';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { api } from '../../lib/api';

export function ActualsImport() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'neutral'; message: string } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setStatus({ tone: 'error', message: 'Bitte eine CSV-Datei hochladen.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const result = await api.importActuals(text);
      setImportResult({ imported: result.imported, errors: result.errors ?? [] });
      setStatus({
        tone: result.errors.length > 0 ? 'neutral' : 'success',
        message: `${result.imported} Einträge importiert. ${result.errors.length} Fehler.`,
      });
    } catch (err) {
      setStatus({ tone: 'error', message: err instanceof Error ? err.message : 'Import fehlgeschlagen' });
    } finally {
      setSubmitting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <SectionCard
      title="Ist-Daten Import"
      description="Importieren Sie tatsächlich geleistete Stunden aus Ihrem Kliniksystem (CSV-Format: nursePublicId; contractId; actualHours; notes)."
    >
      <div className="form-grid">
        <label>
          <span>CSV-Datei</span>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} disabled={submitting} />
        </label>
      </div>
      {submitting ? <p className="hint">Import läuft…</p> : null}
      {status ? <FeedbackMessage tone={status.tone} message={status.message} /> : null}
      {importResult && importResult.errors.length > 0 ? (
        <div style={{ marginTop: '0.75rem' }}>
          <strong>Fehler:</strong>
          <ul className="error-list">
            {importResult.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div style={{ marginTop: '0.75rem' }}>
        <p className="hint">CSV-Format: nursePublicId; contractId; actualHours; notes</p>
        <p className="hint">Beispiel: NUR-001; contract_123; 8; Zusätzliche 2h Nachtschicht</p>
      </div>
    </SectionCard>
  );
}
