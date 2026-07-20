import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Exercise } from '../../../types/database.types';
import { getLog } from '../../../api/logs';
import ExerciseBody from './ExerciseBody';

export default function ExerciseAccordion({ exercise, playerId, locked = false, logDate }: { exercise: Exercise; playerId: string; locked?: boolean; logDate: string }) {
  const [open, setOpen] = useState(false);
  const { data: log } = useQuery({
    queryKey: ['log', exercise.id, playerId, logDate],
    queryFn: () => getLog(exercise.id, playerId, logDate),
    enabled: open,
  });
  const done = log?.is_completed ?? false;
  return <div className="card stack" style={{ background: 'var(--surface)', gap: '0.4rem' }}>
    <button className="secondary" style={{ textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between' }} onClick={() => setOpen((value) => !value)}>
      <span><strong>{exercise.name}</strong><span className="muted" style={{ fontSize: '0.8rem' }}> · {exercise.target_sets ?? '—'}×{exercise.target_reps ?? '—'}</span></span>
      <span>{done ? '✓ ' : ''}{open ? '▾' : '▸'}</span>
    </button>
    {open && <ExerciseBody exercise={exercise} playerId={playerId} logDate={logDate} locked={locked} />}
  </div>;
}
