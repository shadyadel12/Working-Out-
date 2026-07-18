/** Collapsible editor for one player-specific workout assignment. */
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createExercise } from '../../../api/exercises';
import { updateWorkout, deleteWorkout } from '../../../api/workouts';
import { saveWorkoutAsTemplate } from '../../../api/workoutTemplates';
import type { Workout } from '../../../types/database.types';
import VideoInput, { type VideoValue } from '../../../components/VideoInput';
import ExerciseEditor from './ExerciseEditor';

const emptyVideo: VideoValue = { url: null, isExternal: false };

export default function WorkoutCard({ workout, programDayId, playerId, coachId, currentWeek, totalWeeks }: { workout: Workout; programDayId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number }) {
  const qc = useQueryClient();
  const [name, setName] = useState(workout.name);
  const [expanded, setExpanded] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [comment, setComment] = useState('');
  const [video, setVideo] = useState<VideoValue>(emptyVideo);
  const rename = useMutation({ mutationFn: () => updateWorkout(workout.id, name), onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }) });
  const del = useMutation({ mutationFn: () => deleteWorkout(workout.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }) });
  const saveTemplate = useMutation({ mutationFn: () => saveWorkoutAsTemplate(workout.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates', coachId] }) });
  const addExercise = useMutation({
    mutationFn: () => {
      if (!exerciseName.trim()) throw new Error('Enter an exercise name.');
      return createExercise({ workout_id: workout.id, name: exerciseName.trim(), target_sets: sets ? Number(sets) : null, target_reps: reps || null, target_weight: weight || null, coach_comment: comment || null, coach_video_url: video.url, coach_video_is_external: video.isExternal });
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['exercises', workout.id] }); closeExercise(); setExpanded(true); },
  });

  useEffect(() => {
    if (!exerciseOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && !addExercise.isPending && closeExercise();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exerciseOpen, addExercise.isPending]);

  function closeExercise() { setExerciseOpen(false); setExerciseName(''); setSets('3'); setReps('10'); setWeight(''); setComment(''); setVideo(emptyVideo); addExercise.reset(); }

  return <div className={`workout-accordion ${expanded ? 'expanded' : ''}`}>
    <div className="workout-accordion-header">
      <button type="button" className="workout-accordion-trigger" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded} aria-controls={`workout-${workout.id}`}>
        <span><small>Workout</small><strong>{workout.name}</strong></span><span className="workout-accordion-chevron" aria-hidden="true">⌄</span>
      </button>
      <button type="button" className="workout-add-exercise" onClick={() => setExerciseOpen(true)}>+ Add exercise</button>
    </div>
    {expanded && <div id={`workout-${workout.id}`} className="workout-accordion-content stack">
      <div className="row" style={{ justifyContent: 'space-between' }}><div className="field" style={{ margin: 0, flex: 1 }}><label>Workout name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Push" onBlur={() => name !== workout.name && rename.mutate()} /></div><button className="danger" style={{ alignSelf: 'flex-end' }} onClick={() => del.mutate()} disabled={del.isPending}>Delete workout</button></div>
      <div className="row"><button type="button" className="secondary" onClick={() => saveTemplate.mutate()} disabled={saveTemplate.isPending}>{saveTemplate.isPending ? 'Saving…' : 'Save to workout library'}</button>{saveTemplate.isSuccess && <span className="badge active">Saved once for reuse ✓</span>}{saveTemplate.error && <span className="error">{(saveTemplate.error as Error).message}</span>}</div>
      <ExerciseEditor workoutId={workout.id} playerId={playerId} coachId={coachId} currentWeek={currentWeek} totalWeeks={totalWeeks} />
    </div>}

    {exerciseOpen && <div className="workout-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !addExercise.isPending && closeExercise()}>
      <section className="workout-modal exercise-modal" role="dialog" aria-modal="true" aria-labelledby={`add-exercise-${workout.id}`}>
        <header><div><h2 id={`add-exercise-${workout.id}`}>Add Exercise</h2><small>to {workout.name}</small></div><button type="button" className="modal-close" aria-label="Close" onClick={closeExercise}>×</button></header>
        <div className="workout-modal-body">
          <div className="field"><label>Exercise name</label><input autoFocus value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} placeholder="Chest Press" maxLength={160} /></div>
          <div className="modal-target-grid"><div className="field"><label>Target sets</label><input type="number" min="1" max="100" value={sets} onChange={(event) => setSets(event.target.value)} /></div><div className="field"><label>Target reps</label><input value={reps} onChange={(event) => setReps(event.target.value)} placeholder="8-12" /></div><div className="field"><label>Target weight</label><input value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="60 kg" /></div></div>
          <div className="field"><label>Coach notes (optional)</label><textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Technique, tempo, or rest instructions" maxLength={5000} /></div>
          <VideoInput ownerId={playerId} value={video} onChange={setVideo} />
          {addExercise.error && <p className="error">{(addExercise.error as Error).message}</p>}
        </div>
        <footer><button type="button" className="secondary" onClick={closeExercise}>Cancel</button><button type="button" onClick={() => addExercise.mutate()} disabled={addExercise.isPending}>{addExercise.isPending ? 'Saving…' : 'Save exercise'}</button></footer>
      </section>
    </div>}
  </div>;
}
