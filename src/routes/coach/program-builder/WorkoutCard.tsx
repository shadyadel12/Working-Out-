/** Collapsible editor for one player-specific workout assignment. */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWorkout, deleteWorkout } from '../../../api/workouts';
import { saveWorkoutAsTemplate } from '../../../api/workoutTemplates';
import type { Workout } from '../../../types/database.types';
import ExerciseEditor from './ExerciseEditor';

export default function WorkoutCard({ workout, programDayId, playerId, coachId, currentWeek, totalWeeks }: { workout: Workout; programDayId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number }) {
  const qc = useQueryClient();
  const [name, setName] = useState(workout.name);
  const [expanded, setExpanded] = useState(false);
  const rename = useMutation({ mutationFn: () => updateWorkout(workout.id, name), onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }) });
  const del = useMutation({ mutationFn: () => deleteWorkout(workout.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }) });
  const saveTemplate = useMutation({ mutationFn: () => saveWorkoutAsTemplate(workout.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates', coachId] }) });

  return <div className={`workout-accordion ${expanded ? 'expanded' : ''}`}>
    <button type="button" className="workout-accordion-trigger" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded} aria-controls={`workout-${workout.id}`}>
      <span><small>Workout</small><strong>{workout.name}</strong></span><span className="workout-accordion-chevron" aria-hidden="true">⌄</span>
    </button>
    {expanded && <div id={`workout-${workout.id}`} className="workout-accordion-content stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="field" style={{ margin: 0, flex: 1 }}><label>Workout name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Push" onBlur={() => name !== workout.name && rename.mutate()} /></div>
        <button className="danger" style={{ alignSelf: 'flex-end' }} onClick={() => del.mutate()} disabled={del.isPending}>Delete workout</button>
      </div>
      <div className="row">
        <button type="button" className="secondary" onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>{saveTemplate.isPending ? 'Saving…' : 'Save to workout library'}</button>
        {saveTemplate.isSuccess && <span className="badge active">Saved once for reuse ✓</span>}
        {saveTemplate.error && <span className="error">{(saveTemplate.error as Error).message}</span>}
      </div>
      <ExerciseEditor workoutId={workout.id} playerId={playerId} coachId={coachId} currentWeek={currentWeek} totalWeeks={totalWeeks} />
    </div>}
  </div>;
}
