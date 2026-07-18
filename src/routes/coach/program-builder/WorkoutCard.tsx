/** Edits one workout assignment without changing shared templates. */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWorkout, deleteWorkout } from '../../../api/workouts';
import { saveWorkoutAsTemplate } from '../../../api/workoutTemplates';
import type { Workout } from '../../../types/database.types';
import ExerciseEditor from './ExerciseEditor';

export default function WorkoutCard({
  workout, programDayId, playerId, coachId, currentWeek, totalWeeks,
}: {
  workout: Workout;
  programDayId: string;
  playerId: string;
  coachId: string;
  currentWeek: number;
  totalWeeks: number;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(workout.name);

  const rename = useMutation({
    mutationFn: () => updateWorkout(workout.id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }),
  });
  const del = useMutation({
    mutationFn: () => deleteWorkout(workout.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }),
  });
  const saveTemplate = useMutation({
    mutationFn: () => saveWorkoutAsTemplate(workout.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates', coachId] }),
  });

  return (
    <div className="card stack" style={{ background: 'var(--surface-2)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="field" style={{ margin: 0, flex: 1 }}>
          <label>Workout name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Push" onBlur={() => name !== workout.name && rename.mutate()} />
        </div>
        <button className="danger" style={{ alignSelf: 'flex-end' }} onClick={() => del.mutate()} disabled={del.isPending}>
          Delete workout
        </button>
      </div>
      <div className="row">
        <button type="button" className="secondary" onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>{saveTemplate.isPending ? 'SavingÃ¢â‚¬Â¦' : 'Save to workout library'}</button>
        {saveTemplate.isSuccess && <span className="badge active">Saved once for reuse Ã¢Å“â€œ</span>}
        {saveTemplate.error && <span className="error">{(saveTemplate.error as Error).message}</span>}
      </div>
      <ExerciseEditor
        workoutId={workout.id}
        playerId={playerId}
        coachId={coachId}
        currentWeek={currentWeek}
        totalWeeks={totalWeeks}
      />
    </div>
  );
}

