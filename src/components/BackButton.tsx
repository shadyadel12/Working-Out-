import { useNavigate } from 'react-router-dom';
import ActionButtonContent from './ActionButtonContent';

export default function BackButton({ label = 'Back', className = 'muted' }: { label?: string; className?: string }) {
  const navigate = useNavigate();
  return <button type="button" className={`history-back ${className}`} onClick={() => navigate(-1)}><ActionButtonContent action="back">{label}</ActionButtonContent></button>;
}
