import { useLocation } from 'react-router-dom';

export default function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  const location = useLocation();
  const section = location.pathname.split('/').filter(Boolean).pop()?.replace(/[^a-z]/g, '') || 'home';
  return <div className={`page-loader loader-${section.length % 4}`} aria-label={`Loading ${section}`} aria-busy="true"><div className="loader-mark"><span>P</span><i/></div><div className="loader-copy"><strong>Preparing {section.replaceAll('-', ' ')}</strong><small>Your workspace is almost ready</small></div><div className="loader-skeleton card stack"><div className="skeleton skeleton-title" />{Array.from({ length: rows }, (_, index) => <div key={index} className="skeleton skeleton-line" style={{ width: `${92 - index * 7}%` }} />)}</div></div>;
}
