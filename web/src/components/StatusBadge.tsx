export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = normalized.includes('void') || normalized.includes('declin')
    ? 'danger'
    : normalized.includes('sign') || normalized.includes('accept') || normalized.includes('execut')
      ? 'success'
      : 'neutral';

  return <span className={`status-badge ${tone}`}>{value}</span>;
}
