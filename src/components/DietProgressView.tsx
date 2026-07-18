import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listDietLogs } from '../api/dietProgress';
import LoadingSkeleton from './LoadingSkeleton';

type Range = 'all' | 'week' | 'month';

export default function DietProgressView({ playerId }: { playerId: string }) {
  const [range, setRange] = useState<Range>('all');
  const { data: logs = [], isLoading, error } = useQuery({ queryKey: ['diet-progress', playerId], queryFn: () => listDietLogs(playerId) });
  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (range === 'week') start.setDate(now.getDate() - ((now.getDay() + 1) % 7));
    if (range === 'month') start.setDate(1);
    const startISO = start.toISOString().slice(0, 10);
    return range === 'all' ? logs : logs.filter((log) => log.log_date >= startISO);
  }, [logs, range]);
  const completed = filtered.reduce((sum, log) => sum + log.completed_meals, 0);
  const total = filtered.reduce((sum, log) => sum + log.total_meals, 0);
  const adherence = total ? Math.round(completed / total * 100) : 0;
  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error) return <p className="error">{(error as Error).message}</p>;
  return <div className="stack">
    <div className="card row" style={{ alignItems: 'flex-end' }}>
      <div className="field" style={{ margin: 0, minWidth: 180 }}><label>Range</label><select value={range} onChange={(e) => setRange(e.target.value as Range)}><option value="all">All time</option><option value="week">This week</option><option value="month">This month</option></select></div>
    </div>
    <div className="row" style={{ gap: '1rem' }}><Stat label="Diet adherence" value={`${adherence}%`} /><Stat label="Meals followed" value={`${completed}/${total}`} /><Stat label="Days logged" value={String(filtered.length)} /></div>
    {filtered.length === 0 ? <div className="card"><p className="muted">No diet check-ins yet.</p></div> :
      <div className="card" style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={cell}>Date</th><th style={cell}>Meals followed</th><th style={cell}>Adherence</th><th style={cell}>Note</th></tr></thead><tbody>{[...filtered].reverse().map((log) => <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }}><td style={cell}>{log.log_date}</td><td style={cell}>{log.completed_meals}/{log.total_meals}</td><td style={cell}>{Math.round(log.completed_meals / log.total_meals * 100)}%</td><td style={cell}>{log.player_comment ?? '—'}</td></tr>)}</tbody></table></div>}
  </div>;
}

const cell: React.CSSProperties = { padding: '0.55rem', textAlign: 'left' };
function Stat({ label, value }: { label: string; value: string }) { return <div className="card" style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div><div className="muted">{label}</div></div>; }
