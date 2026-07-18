import { useNavigate } from 'react-router-dom';

export default function BackButton({ label = 'Back', className = 'muted' }: { label?: string; className?: string }) {
  const navigate = useNavigate();
  return <button type="button" className={`history-back ${className}`} onClick={() => navigate(-1)}>← {label}</button>;
}
