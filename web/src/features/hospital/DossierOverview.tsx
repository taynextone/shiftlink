import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionCard } from '../../components/SectionCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FeedbackMessage } from '../../components/FeedbackMessage';
import { useAsyncData } from '../../hooks/useAsyncData';
import { api } from '../../lib/api';

type DossierSummary = {
  nurseProfileId: string;
  publicId: string;
  displayName: string;
  isReleasedForMatching: boolean;
  signedAssignmentsCount: number;
  verifiedDocumentsCount: number;
  lastAssignmentDate: string | null;
};

export function DossierOverview() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RELEASED' | 'PENDING'>('ALL');

  const { data, loading, error, reload } = useAsyncData(
    () => api.getHospitalDossierOverview(),
    [],
  );

  const dossiers: DossierSummary[] = data?.dossiers ?? [];

  const filtered = useMemo(() => {
    let result = dossiers;
    if (statusFilter === 'RELEASED') {
      result = result.filter((d) => d.isReleasedForMatching);
    } else if (statusFilter === 'PENDING') {
      result = result.filter((d) => !d.isReleasedForMatching);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (d) =>
          d.displayName.toLowerCase().includes(q) ||
          d.publicId.toLowerCase().includes(q) ||
          d.nurseProfileId.toLowerCase().includes(q),
      );
    }
    return result;
  }, [dossiers, statusFilter, search]);

  const handleExport = useCallback(() => {
    const headers = ['Public ID', 'Name', 'Status', 'Signed Assignments', 'Verified Docs', 'Last Assignment'];
    const rows = filtered.map((d) => [
      d.publicId,
      d.displayName,
      d.isReleasedForMatching ? 'Released' : 'Pending',
      d.signedAssignmentsCount,
      d.verifiedDocumentsCount,
      d.lastAssignmentDate ?? '—',
    ]);
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier-overview-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const stats = useMemo(() => ({
    total: dossiers.length,
    released: dossiers.filter((d) => d.isReleasedForMatching).length,
    pending: dossiers.filter((d) => !d.isReleasedForMatching).length,
    totalAssignments: dossiers.reduce((sum, d) => sum + d.signedAssignmentsCount, 0),
  }), [dossiers]);

  return (
    <SectionCard
      title="Dossier-Übersicht"
      description={`Alle verfügbaren Nurse-Dossiers für dieses Krankenhaus (${stats.total} Einträge).`}
    >
      <div className="form-grid three" style={{ marginBottom: '0.75rem' }}>
        <label>
          <span>Suche</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name oder Public ID…" />
        </label>
        <label>
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'RELEASED' | 'PENDING')}>
            <option value="ALL">Alle</option>
            <option value="RELEASED">Freigegeben</option>
            <option value="PENDING">Ausstehend</option>
          </select>
        </label>
        <div className="actions" style={{ alignSelf: 'end' }}>
          <button type="button" className="secondary" onClick={() => void reload()}>Aktualisieren</button>
          {filtered.length > 0 ? (
            <button type="button" className="secondary" onClick={handleExport}>CSV Export</button>
          ) : null}
        </div>
      </div>

      <div className="metric-grid" style={{ marginBottom: '0.75rem' }}>
        <div className="metric-card">
          <span>Gesamt</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="metric-card">
          <span>Freigegeben</span>
          <strong>{stats.released}</strong>
        </div>
        <div className="metric-card">
          <span>Ausstehend</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className="metric-card">
          <span>Signierte Einsätze</span>
          <strong>{stats.totalAssignments}</strong>
        </div>
      </div>

      {loading ? <p className="hint">Wird geladen…</p> : null}
      {error ? <FeedbackMessage tone="error" message={`Fehler: ${String(error)}`} /> : null}

      <div className="record-list compact-list">
        {filtered.map((dossier) => (
          <Link
            key={dossier.nurseProfileId}
            to={`/hospital/dossier?nurseProfileId=${encodeURIComponent(dossier.nurseProfileId)}`}
            className="record-row"
          >
            <div className="record-main">
              <strong>{dossier.displayName}</strong>
              <span className="hint">{dossier.publicId}</span>
            </div>
            <div className="record-meta">
              <StatusBadge value={dossier.isReleasedForMatching ? 'released' : 'pending'} />
              <span>{dossier.signedAssignmentsCount} Einsätze</span>
              <span>{dossier.verifiedDocumentsCount} Docs</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && !loading ? (
          <p className="hint">Keine Dossiers gefunden.</p>
        ) : null}
      </div>
    </SectionCard>
  );
}
