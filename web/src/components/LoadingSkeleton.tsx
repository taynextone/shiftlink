type LoadingSkeletonProps = {
  title?: string;
  rows?: number;
  compact?: boolean;
};

export function LoadingSkeleton({ title = 'Daten werden geladen', rows = 4, compact = false }: LoadingSkeletonProps) {
  return (
    <div className={compact ? 'loading-skeleton compact' : 'loading-skeleton'} role="status" aria-live="polite" aria-label={title}>
      <div className="skeleton-header">
        <span className="skeleton-dot" />
        <span>{title}</span>
      </div>
      <div className="skeleton-lines" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <span key={index} className={index === rows - 1 ? 'skeleton-line short' : 'skeleton-line'} />
        ))}
      </div>
    </div>
  );
}
