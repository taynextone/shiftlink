import type { ReactNode } from 'react';

type InfoItem = {
  label: string;
  value: ReactNode;
};

export function InfoList({ items }: { items: InfoItem[] }) {
  return (
    <div className="detail-panel stack">
      {items.map((item) => (
        <div className="detail-row" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
