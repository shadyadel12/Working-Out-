import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { listCoaches } from '../../api/admin';
import { listCoachThreadSummaries, subscribeToAllAdminMessages, type CoachThreadSummary } from '../../api/adminChat';
import SupportChatWindow from '../../components/SupportChatWindow';

const LS_KEY = (adminId: string, coachId: string) =>
  `lastRead_support_${adminId}_${coachId}`;

function getSinceByCoach(adminId: string, coachIds: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of coachIds) {
    const v = localStorage.getItem(LS_KEY(adminId, id));
    if (v) map[id] = v;
  }
  return map;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function AdminSupport() {
  const { session } = useAuth();
  const adminId = session?.user.id ?? 'temporary-admin-preview';
  const qc = useQueryClient();
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);

  const { data: coaches = [] } = useQuery({ queryKey: ['coaches'], queryFn: listCoaches });

  const coachIds = coaches.map((c) => c.id);

  const { data: summaries = [] } = useQuery<CoachThreadSummary[]>({
    queryKey: ['adminThreadSummaries', adminId, coachIds.join(',')],
    queryFn: () => listCoachThreadSummaries(adminId, getSinceByCoach(adminId, coachIds)),
    enabled: coachIds.length > 0,
    refetchInterval: 15_000,
  });

  // Build a map for fast summary lookup
  const summaryByCoach = Object.fromEntries(summaries.map((s) => [s.coach_id, s]));

  // Sort coaches: those with summaries (most recent first), then rest
  const sortedCoaches = [...coaches].sort((a, b) => {
    const sa = summaryByCoach[a.id];
    const sb = summaryByCoach[b.id];
    if (sa && sb) return sb.last_at.localeCompare(sa.last_at);
    if (sa) return -1;
    if (sb) return 1;
    return 0;
  });

  const markCoachRead = useCallback(
    (coachId: string) => {
      localStorage.setItem(LS_KEY(adminId, coachId), new Date().toISOString());
      // Refetch summaries so badge disappears
      qc.invalidateQueries({ queryKey: ['adminThreadSummaries'] });
    },
    [adminId, qc]
  );

  function handleSelectCoach(coachId: string) {
    setSelectedCoachId(coachId);
    markCoachRead(coachId);
  }

  // Also mark read whenever a new message arrives while the chat is open
  useEffect(() => {
    if (selectedCoachId) markCoachRead(selectedCoachId);
  }, [selectedCoachId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live-refresh the inbox list on any incoming message (re-sort + badge update).
  useEffect(() => {
    const ch = subscribeToAllAdminMessages(() => {
      qc.invalidateQueries({ queryKey: ['adminThreadSummaries'] });
    });
    return () => { ch.unsubscribe(); };
  }, [qc]);

  const selectedCoach = coaches.find((c) => c.id === selectedCoachId);

  return (
    <div className="stack">
      <h1>Coach Support</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedCoachId ? '280px 1fr' : '280px',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Coach list */}
        <div className="card stack" style={{ gap: 0, padding: '0.5rem' }}>
          <strong
            style={{
              fontSize: '0.78rem',
              letterSpacing: '0.04em',
              color: 'var(--text-dim)',
              padding: '0.25rem 0.5rem 0.5rem',
              display: 'block',
            }}
          >
            COACHES
          </strong>

          {sortedCoaches.length === 0 && (
            <p className="muted" style={{ fontSize: '0.85rem', margin: '0.5rem' }}>
              No coaches yet.
            </p>
          )}

          {sortedCoaches.map((c) => {
            const summary = summaryByCoach[c.id];
            const isSelected = selectedCoachId === c.id;
            const unread = isSelected ? 0 : (summary?.unread ?? 0);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelectCoach(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  textAlign: 'left',
                  padding: '0.6em 0.75em',
                  borderRadius: 'var(--radius)',
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  color: isSelected ? 'var(--accent-text)' : 'var(--text)',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {/* Avatar circle */}
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    flexShrink: 0,
                  }}
                >
                  {(c.name ?? c.email ?? '?')[0].toUpperCase()}
                </div>

                {/* Name + preview */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: unread > 0 ? 700 : 500,
                      fontSize: '0.88rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.name ?? c.email}
                  </div>
                  {summary && (
                    <div
                      style={{
                        fontSize: '0.76rem',
                        opacity: isSelected ? 0.8 : 0.6,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: unread > 0 ? 600 : 400,
                      }}
                    >
                      {summary.last_sender_id !== c.id ? 'You: ' : ''}
                      {summary.last_body.slice(0, 40) || '📎 Attachment'}
                    </div>
                  )}
                </div>

                {/* Right: time + badge */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.2rem',
                    flexShrink: 0,
                  }}
                >
                  {summary && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        opacity: 0.6,
                        whiteSpace: 'nowrap',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-dim)',
                      }}
                    >
                      {formatTime(summary.last_at)}
                    </span>
                  )}
                  {unread > 0 && (
                    <span
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--accent-text)',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        minWidth: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}
                    >
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Chat pane */}
        {selectedCoachId && (
          <div className="stack">
            <strong style={{ fontSize: '1rem' }}>
              {selectedCoach?.name ?? selectedCoach?.email ?? '…'}
              <span style={{ fontWeight: 400, fontSize: '0.82rem', marginLeft: '0.5rem', color: 'var(--text-dim)' }}>
                {selectedCoach?.email}
              </span>
            </strong>
            <SupportChatWindow
              coachId={selectedCoachId}
              currentUserId={adminId}
              coachName={selectedCoach?.name ?? selectedCoach?.email ?? 'Coach'}
              onNewMessage={() => markCoachRead(selectedCoachId)}
            />
          </div>
        )}

        {!selectedCoachId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Select a coach to open their support thread.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
