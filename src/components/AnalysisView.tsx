import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProgressOptions, getProgressPage, type ProgressRange } from '../api/analysis';
import { markPlayerVideoViewed } from '../api/logs';
import VideoPlayer from './VideoPlayer';
import LoadingSkeleton from './LoadingSkeleton';

const PAGE_SIZE = 20;

export default function AnalysisView({ playerId, coachView = false }: { playerId: string; coachView?: boolean }) {
  const [workout, setWorkout] = useState('');
  const [exercise, setExercise] = useState('');
  const [range, setRange] = useState<ProgressRange>('all');
  const [page, setPage] = useState(0);
  const [openVideos, setOpenVideos] = useState<Set<string>>(new Set());
  const [markedViewed, setMarkedViewed] = useState<Set<string>>(new Set());
  const options = useQuery({ queryKey: ['progress-options', playerId], queryFn: () => getProgressOptions(playerId) });
  const progress = useQuery({
    queryKey: ['progress-page', playerId, workout, exercise, range, page],
    queryFn: () => getProgressPage({ playerId, workout, exercise, range, page, pageSize: PAGE_SIZE }),
    placeholderData: (previous) => previous,
  });
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; workouts: string[]; logs: NonNullable<typeof progress.data>['rows'] }>();
    for (const row of progress.data?.rows ?? []) {
      const group = map.get(row.exercise_name) ?? { name: row.exercise_name, workouts: [], logs: [] };
      if (!group.workouts.includes(row.workout_name)) group.workouts.push(row.workout_name);
      group.logs.push(row); map.set(row.exercise_name, group);
    }
    return [...map.values()];
  }, [progress.data]);
  const change = (setter: (value: string) => void, value: string) => { setter(value); setPage(0); };
  if (options.isLoading || progress.isLoading) return <LoadingSkeleton rows={7} />;
  const error = options.error || progress.error;
  if (error) return <p className="error">{(error as Error).message}</p>;
  const data = progress.data;
  if (!data) return null;
  const filterActive = !!workout || !!exercise || range !== 'all';
  return <div className="stack">
    <div className="card row" style={{ flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
      <Filter label="Workout" value={workout} all="All workouts" options={options.data?.workouts ?? []} onChange={(value) => change(setWorkout, value)} />
      <Filter label="Exercise" value={exercise} all="All exercises" options={options.data?.exercises ?? []} onChange={(value) => change(setExercise, value)} />
      <div className="field" style={{ margin: 0, flex: 1, minWidth: 140 }}><label>Range</label><select value={range} onChange={(event) => { setRange(event.target.value as ProgressRange); setPage(0); }}><option value="all">All time</option><option value="today">Today only</option><option value="week">This week (Sat–Fri)</option><option value="month">This month</option></select></div>
      {filterActive && <button className="secondary" onClick={() => { setWorkout(''); setExercise(''); setRange('all'); setPage(0); }}>Clear</button>}
    </div>
    {progress.isFetching && <span className="muted" aria-live="polite">Updating results…</span>}
    <div className="row" style={{ gap: '1rem' }}><Stat label={filterActive ? 'Completed (filtered)' : 'Workouts completed'} value={data.totalCompleted} /><Stat label={filterActive ? 'Sessions (filtered)' : 'Sessions logged'} value={data.totalLogged} /><Stat label="Exercises shown" value={data.totalExercises} /></div>
    {groups.length === 0 && <div className="card"><p className="muted">{filterActive ? 'No sessions match the current filters.' : 'No logged sessions yet. Data appears once workouts are logged.'}</p></div>}
    {groups.map((group) => <div key={group.name} className="card stack"><div><strong>{group.name}</strong><span className="muted" style={{ marginLeft: 8 }}>— {group.workouts.join(', ')}</span></div><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th style={cell}>Date</th><th style={cell}>Sets</th><th style={cell}>Reps</th><th style={cell}>Weight</th><th style={cell}>Done</th><th style={cell}>Note</th><th style={cell}>Video</th></tr></thead><tbody>{group.logs.map((log) => <Fragment key={log.id}><tr style={{ borderTop: '1px solid var(--border)' }}><td style={cell}>{log.log_date}</td><td style={cell}>{log.actual_sets ?? '—'}</td><td style={cell}>{log.actual_reps ?? '—'}</td><td style={cell}>{log.actual_weight ?? '—'}</td><td style={cell}>{log.is_completed ? '✓' : '—'}</td><td style={cell}>{log.player_comment ?? ''}</td><td style={cell}>{coachView && log.player_video_url && <button className="secondary" onClick={() => setOpenVideos((current) => { const next = new Set(current); next.has(log.id) ? next.delete(log.id) : next.add(log.id); return next; })}>{openVideos.has(log.id) ? 'Hide' : 'View'}</button>}</td></tr>{coachView && log.player_video_url && openVideos.has(log.id) && <tr><td colSpan={7} style={cell}><VideoPlayer url={log.player_video_url} isExternal={log.player_video_is_external} onPlay={log.player_video_is_external ? undefined : () => { if (markedViewed.has(log.id)) return; setMarkedViewed((current) => new Set(current).add(log.id)); void markPlayerVideoViewed(log.id); }} /></td></tr>}</Fragment>)}</tbody></table></div></div>)}
    {data.totalLogged > PAGE_SIZE && <div className="row" style={{ justifyContent: 'center' }}><button className="secondary" disabled={page === 0 || progress.isFetching} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="muted">Page {page + 1} of {Math.ceil(data.totalLogged / PAGE_SIZE)}</span><button className="secondary" disabled={(page + 1) * PAGE_SIZE >= data.totalLogged || progress.isFetching} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
  </div>;
}

function Filter({ label, value, all, options, onChange }: { label: string; value: string; all: string; options: string[]; onChange: (value: string) => void }) { return <div className="field" style={{ margin: 0, flex: 1, minWidth: 160 }}><label>{label}</label><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{all}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="card" style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div><div className="muted">{label}</div></div>; }
const cell: React.CSSProperties = { padding: '0.45rem 0.6rem', textAlign: 'left' };
