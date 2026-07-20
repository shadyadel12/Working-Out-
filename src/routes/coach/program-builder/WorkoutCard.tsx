/** Collapsible editor for one player-specific workout assignment. */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createExercise } from '../../../api/exercises';
import { updateWorkout, deleteWorkout } from '../../../api/workouts';
import { saveWorkoutAsTemplate } from '../../../api/workoutTemplates';
import { duplicateWorkoutToWeeks } from '../../../api/programs';
import type { Workout } from '../../../types/database.types';
import VideoInput, { type VideoValue } from '../../../components/VideoInput';
import ExerciseEditor from './ExerciseEditor';
import WeekPicker from '../../../components/WeekPicker';
import { listLibraryExercises } from '../../../api/exerciseLibrary';
import { useWorkoutCompletion } from '../../../hooks/useWorkoutCompletion';

const emptyVideo: VideoValue = { url: null, isExternal: false };

export default function WorkoutCard({ workout, programDayId, playerId, coachId, currentWeek, totalWeeks }: { workout: Workout; programDayId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number }) {
  const qc = useQueryClient();
  const [name, setName] = useState(workout.name);
  const [expanded, setExpanded] = useState(false);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [comment, setComment] = useState('');
  const [video, setVideo] = useState<VideoValue>(emptyVideo);
  const completion = useWorkoutCompletion(workout.id, playerId);
  const rename = useMutation({ mutationFn: () => updateWorkout(workout.id, name), onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }) });
  const del = useMutation({ mutationFn: () => deleteWorkout(workout.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }) });
  const duplicate = useMutation({ mutationFn: (weeks: number[]) => duplicateWorkoutToWeeks(playerId, coachId, workout.id, weeks), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['program', playerId] }); setDuplicateOpen(false); } });
  const saveTemplate = useMutation({ mutationFn: () => saveWorkoutAsTemplate(workout.id), onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-templates', coachId] }) });
  const { data: library = [] } = useQuery({ queryKey: ['exercise-library', coachId], queryFn: () => listLibraryExercises(coachId) });
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
        <span><small>Workout</small><strong>{workout.name}</strong>{completion.data?.completed && <span className="workout-completion-badge">✓ Player completed</span>}</span><span className="workout-accordion-chevron" aria-hidden="true">⌄</span>
      </button>
      <button type="button" className="workout-add-exercise" onClick={() => setExerciseOpen(true)}>+ Add exercise</button>
      <button type="button" className="workout-row-action" onClick={() => setDuplicateOpen(true)}>Duplicate</button>
      <button type="button" className="workout-row-action danger-text" onClick={() => setDeleteOpen(true)}>Delete</button>
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
          {library.length > 0 && <div className="field"><label>Use Exercise Library</label><select defaultValue="" onChange={(event) => { const item = library.find((entry) => entry.id === event.target.value); if (item) { setExerciseName(item.name); setComment(item.default_note ?? item.instructions ?? ''); setVideo(item.video_url ? { url: item.video_url, isExternal: true } : emptyVideo); } }}><option value="">Choose a saved exercise…</option>{library.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.category}</option>)}</select></div>}
          <div className="field"><label>Exercise name</label><input autoFocus value={exerciseName} onChange={(event) => setExerciseName(event.target.value)} placeholder="Chest Press" maxLength={160} /></div>
          <div className="modal-target-grid"><div className="field"><label>Target sets</label><input type="number" min="1" max="100" value={sets} onChange={(event) => setSets(event.target.value)} /></div><div className="field"><label>Target reps</label><input value={reps} onChange={(event) => setReps(event.target.value)} placeholder="8-12" /></div><div className="field"><label>Target weight</label><input value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="60 kg" /></div></div>
          <div className="field"><label>Coach notes (optional)</label><textarea rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Technique, tempo, or rest instructions" maxLength={5000} /></div>
          <VideoInput ownerId={playerId} value={video} onChange={setVideo} />
          {addExercise.error && <p className="error">{(addExercise.error as Error).message}</p>}
        </div>
        <footer><button type="button" className="secondary" onClick={closeExercise}>Cancel</button><button type="button" onClick={() => addExercise.mutate()} disabled={addExercise.isPending}>{addExercise.isPending ? 'Saving…' : 'Save exercise'}</button></footer>
      </section>
    </div>}
    {duplicateOpen && <div className="workout-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !duplicate.isPending && setDuplicateOpen(false)}><section className="workout-modal workout-action-modal" role="dialog" aria-modal="true"><header><div><h2>Duplicate Workout</h2><small>{workout.name} and all its exercises</small></div><button type="button" className="modal-close" onClick={() => setDuplicateOpen(false)}>×</button></header><div className="workout-modal-body"><WeekPicker excludeWeek={currentWeek} totalWeeks={totalWeeks} busy={duplicate.isPending} onDuplicate={(weeks) => duplicate.mutate(weeks)} onCancel={() => setDuplicateOpen(false)} label="Choose where to copy this workout" />{duplicate.error && <p className="error">{(duplicate.error as Error).message}</p>}</div></section></div>}
    {deleteOpen && <div className="workout-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !del.isPending && setDeleteOpen(false)}><section className="workout-modal workout-action-modal" role="alertdialog" aria-modal="true"><header><h2>Delete Workout?</h2><button type="button" className="modal-close" onClick={() => setDeleteOpen(false)}>×</button></header><div className="workout-modal-body"><p>This will delete <strong>{workout.name}</strong> and all its exercises from this day.</p>{del.error && <p className="error">{(del.error as Error).message}</p>}</div><footer><button type="button" className="secondary" onClick={() => setDeleteOpen(false)}>Cancel</button><button type="button" className="danger" disabled={del.isPending} onClick={() => del.mutate()}>{del.isPending ? 'Deleting…' : 'Delete workout'}</button></footer></section></div>}
  </div>;
}
