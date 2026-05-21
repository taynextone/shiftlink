import type { ReactNode } from 'react';

type MetricItem = {
  label: string;
  value: ReactNode;
};

export function MetricList({ items }: { items: MetricItem[] }) {
  return (
    <div className="metric-list">
      {items.map((item) => (
        <div className="metric-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
