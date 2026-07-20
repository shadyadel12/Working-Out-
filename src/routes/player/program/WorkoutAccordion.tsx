import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listExercises } from '../../../api/exercises';
import { confirmWorkout } from '../../../api/logs';
import type { Workout } from '../../../types/database.types';
import { todayISO } from '../../../lib/dates';
import { useWorkoutCompletion } from '../../../hooks/useWorkoutCompletion';
import ExerciseAccordion from './ExerciseAccordion';

export default function WorkoutAccordion({ workout, playerId }: { workout: Workout; playerId: string }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const completion = useWorkoutCompletion(workout.id, playerId);
  const locked = completion.data?.completed === true && !editing;
  const { data: exercises } = useQuery({
    queryKey: ['exercises', workout.id],
    queryFn: () => listExercises(workout.id),
    enabled: open,
  });
  const confirm = useMutation({
    mutationFn: () => confirmWorkout(workout.id, playerId, todayISO()),
    onSuccess: async () => {
      setEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workout-completion', workout.id, playerId] }),
        queryClient.invalidateQueries({ queryKey: ['log'] }),
        queryClient.invalidateQueries({ queryKey: ['progress-page', playerId] }),
      ]);
    },
  });

  return <div className="card stack" style={{ background: 'var(--surface-2)', gap: '0.4rem' }}>
    <button className="secondary" style={{ textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between' }} onClick={() => setOpen((value) => !value)}>
      <span><strong>{workout.name}</strong>{completion.data?.completed && <span className="workout-completion-badge" style={{ marginLeft: 8 }}>✓ Done</span>}</span>
      <span>{open ? '▾' : '▸'}</span>
    </button>
    {open && (exercises ?? []).map((exercise, index) => <ExerciseAccordion
      key={exercise.id}
      exercise={exercise}
      playerId={playerId}
      locked={locked}
      logDate={completion.data?.logDate ?? todayISO()}
      open={activeExerciseId === exercise.id}
      onToggle={() => setActiveExerciseId((current) => current === exercise.id ? null : exercise.id)}
      onCompleted={() => setActiveExerciseId(exercises?.[index + 1]?.id ?? null)}
    />)}
    {open && (exercises ?? []).length === 0 && <p className="muted" style={{ fontSize: '0.85rem' }}>No exercises.</p>}
    {open && (exercises ?? []).length > 0 && <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
      {locked ? <><span className="workout-locked-note">Workout submitted. Select Edit to change your sets, note, or video.</span><button type="button" className="secondary" onClick={() => setEditing(true)}>Edit workout</button></> : <><span className="muted">{editing ? 'Editing a submitted workout. Confirm again when finished.' : 'Confirm when you have finished the complete workout.'}</span><button type="button" onClick={() => confirm.mutate()} disabled={confirm.isPending}>{confirm.isPending ? 'Submitting…' : completion.data?.completed ? 'Confirm changes ✓' : 'Confirm workout ✓'}</button></>}
      {confirm.error && <span className="error">{(confirm.error as Error).message}</span>}
    </div>}
  </div>;
}
