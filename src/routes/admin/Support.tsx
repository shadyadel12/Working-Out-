import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { listCoaches } from '../../api/admin';
import SupportChatWindow from '../../components/SupportChatWindow';

export default function AdminSupport() {
  const { session } = useAuth();
  const adminId = session!.user.id;
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);

  const { data: coaches } = useQuery({ queryKey: ['coaches'], queryFn: listCoaches });

  const selectedCoach = (coaches ?? []).find((c) => c.id === selectedCoachId);

  return (
    <div className="stack">
      <h1>Coach Support</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedCoachId ? '260px 1fr' : '1fr',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Coach list */}
        <div className="card stack" style={{ gap: '0.4rem', padding: '0.75rem' }}>
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>COACHES</strong>
          {(coaches ?? []).length === 0 && (
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>No coaches yet.</p>
          )}
          {(coaches ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCoachId(c.id)}
              style={{
                textAlign: 'left',
                padding: '0.55em 0.75em',
                borderRadius: 'var(--radius)',
                background: selectedCoachId === c.id ? 'var(--accent)' : 'transparent',
                color: selectedCoachId === c.id ? 'var(--accent-text)' : 'var(--text)',
                border: selectedCoachId === c.id ? 'none' : '1px solid transparent',
                fontWeight: selectedCoachId === c.id ? 600 : 400,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              {c.name ?? c.email}
              <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{c.email}</div>
            </button>
          ))}
        </div>

        {/* Chat pane */}
        {selectedCoachId && (
          <div className="stack">
            <strong>
              {selectedCoach?.name ?? selectedCoach?.email ?? '…'}
            </strong>
            <SupportChatWindow coachId={selectedCoachId} currentUserId={adminId} />
          </div>
        )}
      </div>

      {!selectedCoachId && (coaches ?? []).length > 0 && (
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          Select a coach on the left to open their support thread.
        </p>
      )}
    </div>
  );
}
