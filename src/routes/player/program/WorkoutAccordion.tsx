/** Expandable player view for one workout and its exercises. */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listExercises } from '../../../api/exercises';
import type { Workout } from '../../../types/database.types';
import ExerciseAccordion from './ExerciseAccordion';

export default function WorkoutAccordion({ workout, playerId }: { workout: Workout; playerId: string }) {
  const [open, setOpen] = useState(false);

  const { data: exercises } = useQuery({
    queryKey: ['exercises', workout.id],
    queryFn: () => listExercises(workout.id),
    enabled: open,
  });

  return (
    <div className="card stack" style={{ background: 'var(--surface-2)', gap: '0.4rem' }}>
      <button
        className="secondary"
        style={{ textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between' }}
        onClick={() => setOpen((o) => !o)}
      >
        <strong>{workout.name}</strong>
        <span>{open ? '▾' : '▸'}</span>
      </button>

      {open &&
        (exercises ?? []).map((ex) => (
          <ExerciseAccordion key={ex.id} exercise={ex} playerId={playerId} />
        ))}
      {open && (exercises ?? []).length === 0 && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>No exercises.</p>
      )}
    </div>
  );
}

/** Level 3: an exercise. Collapsed by default; expands to log/upload. */
