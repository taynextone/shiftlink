const statusLabels: Record<string, string> = {
  ACCEPT: 'Annehmen',
  ACCEPTED: 'Angenommen',
  ACTIVE: 'Aktiv',
  ACTIVATED: 'Aktiviert',
  CANCELED: 'Storniert',
  CONTRACT_VOID: 'Vertrag beendet',
  DECLINE: 'Ablehnen',
  DECLINED: 'Abgelehnt',
  DELIVERED: 'Zugestellt',
  DRAFT: 'Entwurf',
  EXECUTED: 'Ausgeführt',
  EXPIRED: 'Abgelaufen',
  FAILED: 'Fehlgeschlagen',
  FULLY_EXECUTED: 'Vollständig ausgeführt',
  HOSPITAL_ADMIN: 'Krankenhaus',
  INVOICED: 'Abgerechnet',
  NURSE: 'Pflegekraft',
  OVERDUE: 'Überfällig',
  PAID: 'Bezahlt',
  PENDING: 'Offen',
  PENDING_HOSPITAL_SIGNATURE: 'Wartet auf Klinik-Signatur',
  PENDING_NURSE_SIGNATURE: 'Wartet auf Pflegekraft-Signatur',
  PROFILE_RELEASE: 'Profilfreigabe',
  RELEASED: 'Freigegeben',
  REJECTED: 'Abgelehnt',
  SENT: 'Gesendet',
  SIGNED: 'Signiert',
  SUPER_ADMIN: 'Superadmin',
  VERIFIED: 'Verifiziert',
  VOIDED: 'Beendet',
  WAIVED: 'Verzichtet',
};

export function formatStatusLabel(value: string) {
  const compactCount = value.match(/^(\d+)\s+(active|profile)$/i);
  if (compactCount) {
    return `${compactCount[1]} ${compactCount[2].toLowerCase() === 'active' ? 'aktiv' : 'Profile'}`;
  }

  return statusLabels[value.toUpperCase()] ?? value;
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = normalized.includes('void') || normalized.includes('declin')
    ? 'danger'
    : normalized.includes('sign') || normalized.includes('accept') || normalized.includes('execut')
      ? 'success'
      : 'neutral';

  return <span className={`status-badge ${tone}`} title={value}>{formatStatusLabel(value)}</span>;
}
