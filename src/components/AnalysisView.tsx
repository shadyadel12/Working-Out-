import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProgressOptions, getProgressPage, type ProgressRange } from '../api/analysis';
import { markPlayerVideoViewed } from '../api/logs';
import LoadingSkeleton from './LoadingSkeleton';
import ProgressFilter from './progress/ProgressFilter';
import ProgressStat from './progress/ProgressStat';
import VideoDialog from './VideoDialog';

const PAGE_SIZE = 20;
const cell: React.CSSProperties = { padding: '0.45rem 0.6rem', textAlign: 'left' };

export default function AnalysisView({ playerId, coachView = false }: { playerId: string; coachView?: boolean }) {
  const [workout, setWorkout] = useState('');
  const [exercise, setExercise] = useState('');
  const [range, setRange] = useState<ProgressRange>('all');
  const [applied, setApplied] = useState({ workout: '', exercise: '', range: 'all' as ProgressRange });
  const [page, setPage] = useState(0);
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);
  const [markedViewed, setMarkedViewed] = useState<Set<string>>(new Set());
  const options = useQuery({ queryKey: ['progress-options', playerId], queryFn: () => getProgressOptions(playerId) });
  const progress = useQuery({
    queryKey: ['progress-page', playerId, applied.workout, applied.exercise, applied.range, page],
    queryFn: () => getProgressPage({ playerId, ...applied, page, pageSize: PAGE_SIZE }),
    placeholderData: (previous) => previous,
  });
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; workouts: string[]; logs: NonNullable<typeof progress.data>['rows'] }>();
    for (const row of progress.data?.rows ?? []) {
      const group = map.get(row.exercise_name) ?? { name: row.exercise_name, workouts: [], logs: [] };
      if (!group.workouts.includes(row.workout_name)) group.workouts.push(row.workout_name);
      group.logs.push(row);
      map.set(row.exercise_name, group);
    }
    return [...map.values()];
  }, [progress.data]);

  if (options.isLoading || progress.isLoading) return <LoadingSkeleton rows={7} />;
  const error = options.error || progress.error;
  if (error) return <p className="error">{(error as Error).message}</p>;
  const data = progress.data;
  if (!data) return null;
  const openVideo = data.rows.find((row) => row.id === openVideoId) ?? null;
  const filterActive = !!applied.workout || !!applied.exercise || applied.range !== 'all';
  const filtersChanged = workout !== applied.workout || exercise !== applied.exercise || range !== applied.range;

  return <div className="stack">
    <div className="card row" style={{ flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
      <ProgressFilter label="Workout" value={workout} all="All workouts" options={options.data?.workouts ?? []} onChange={setWorkout} />
      <ProgressFilter label="Exercise" value={exercise} all="All exercises" options={options.data?.exercises ?? []} onChange={setExercise} />
      <div className="field" style={{ margin: 0, flex: 1, minWidth: 140 }}><label>Range</label><select value={range} onChange={(event) => setRange(event.target.value as ProgressRange)}><option value="all">All time</option><option value="today">Today only</option><option value="week">This week (Sat–Fri)</option><option value="month">This month</option></select></div>
      <button disabled={!filtersChanged || progress.isFetching} onClick={() => { setApplied({ workout, exercise, range }); setPage(0); }}>Apply</button>
      {filterActive && <button className="secondary" onClick={() => { setWorkout(''); setExercise(''); setRange('all'); setApplied({ workout: '', exercise: '', range: 'all' }); setPage(0); }}>Clear</button>}
    </div>
    {progress.isFetching && <span className="muted" aria-live="polite">Updating results…</span>}
    <div className="row" style={{ gap: '1rem' }}><ProgressStat label={filterActive ? 'Completed (filtered)' : 'Workouts completed'} value={data.totalCompleted} /><ProgressStat label={filterActive ? 'Sessions (filtered)' : 'Sessions logged'} value={data.totalLogged} /><ProgressStat label="Exercises shown" value={data.totalExercises} /></div>
    {groups.length === 0 && <div className="card"><p className="muted">{filterActive ? 'No sessions match the current filters.' : 'No logged sessions yet. Data appears once workouts are logged.'}</p></div>}
    {groups.map((group) => <div key={group.name} className="card stack">
      <div><strong>{group.name}</strong><span className="muted" style={{ marginLeft: 8 }}>— {group.workouts.join(', ')}</span></div>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><th style={cell}>Date</th><th style={cell}>Sets</th><th style={cell}>Reps</th><th style={cell}>Weight</th><th style={cell}>Done</th><th style={cell}>Note</th><th style={cell}>Video</th></tr></thead>
        <tbody>{group.logs.map((log) => <tr key={log.id} style={{ borderTop: '1px solid var(--border)' }}><td style={cell}>{log.log_date}</td><td style={cell}>{log.actual_sets ?? '—'}</td><td style={cell}>{log.actual_reps ?? '—'}</td><td style={cell}>{log.actual_weight ?? '—'}</td><td style={cell}>{log.is_completed ? '✓' : '—'}</td><td style={cell}>{log.player_comment ?? ''}</td><td style={cell}>{coachView && log.player_video_url && <button className="secondary" onClick={() => setOpenVideoId(log.id)}>View video</button>}</td></tr>)}</tbody>
      </table></div>
    </div>)}
    {data.totalLogged > PAGE_SIZE && <div className="row" style={{ justifyContent: 'center' }}><button className="secondary" disabled={page === 0 || progress.isFetching} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="muted">Page {page + 1} of {Math.ceil(data.totalLogged / PAGE_SIZE)}</span><button className="secondary" disabled={(page + 1) * PAGE_SIZE >= data.totalLogged || progress.isFetching} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    <VideoDialog
      open={!!openVideo}
      title={openVideo ? `${openVideo.exercise_name} · ${openVideo.log_date}` : 'Player video'}
      url={openVideo?.player_video_url ?? null}
      isExternal={openVideo?.player_video_is_external ?? false}
      onClose={() => setOpenVideoId(null)}
      onPlay={!openVideo || openVideo.player_video_is_external ? undefined : () => {
        if (markedViewed.has(openVideo.id)) return;
        setMarkedViewed((current) => new Set(current).add(openVideo.id));
        void markPlayerVideoViewed(openVideo.id);
      }}
    />
  </div>;
}
