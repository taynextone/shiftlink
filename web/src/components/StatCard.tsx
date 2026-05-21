type StatCardProps = {
  label: string;
  value: string;
  caption: string;
};

export function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <article className="panel stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <p className="stat-caption">{caption}</p>
    </article>
  );
}
