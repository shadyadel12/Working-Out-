export default function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="card stack" aria-label="Loading" aria-busy="true"><div className="skeleton skeleton-title" />{Array.from({ length: rows }, (_, index) => <div key={index} className="skeleton skeleton-line" style={{ width: `${92 - index * 7}%` }} />)}</div>;
}
