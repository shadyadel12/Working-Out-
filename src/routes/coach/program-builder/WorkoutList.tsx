/** Lists a day's workouts and creates complete workouts in a focused popup. */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createExercises } from '../../../api/exercises';
import { createWorkout, deleteWorkout, listWorkouts } from '../../../api/workouts';
import { assignWorkoutTemplate, listWorkoutTemplates, saveWorkoutAsTemplate } from '../../../api/workoutTemplates';
import type { DraftExerciseData } from '../../../api/programs';
import VideoInput from '../../../components/VideoInput';
import WorkoutCard from './WorkoutCard';

const blankExercise = (): DraftExerciseData => ({ name: '', target_sets: 3, target_reps: '10', target_weight: null, coach_comment: null, coach_video_url: null, coach_video_is_external: false });

export default function WorkoutList({ programDayId, playerId, coachId, currentWeek, totalWeeks }: { programDayId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('New Workout');
  const [exercises, setExercises] = useState<DraftExerciseData[]>([blankExercise()]);
  const [templateId, setTemplateId] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const { data: workouts } = useQuery({ queryKey: ['workouts', programDayId], queryFn: () => listWorkouts(programDayId) });
  const { data: templates = [] } = useQuery({ queryKey: ['workout-templates', coachId], queryFn: () => listWorkoutTemplates(coachId) });

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);

  const saveNew = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Enter a workout name.');
      if (exercises.some((exercise) => !exercise.name.trim())) throw new Error('Enter a name for every exercise.');
      const workout = await createWorkout(programDayId, name.trim(), workouts?.length ?? 0);
      try {
        await createExercises(exercises.map((exercise, position) => ({ ...exercise, name: exercise.name.trim(), workout_id: workout.id, position })));
        if (saveToLibrary) await saveWorkoutAsTemplate(workout.id);
      } catch (error) { await deleteWorkout(workout.id); throw error; }
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['workouts', programDayId] }); setOpen(false); reset(); },
  });
  const useTemplate = useMutation({
    mutationFn: () => assignWorkoutTemplate(programDayId, templateId, workouts?.length ?? 0),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['workouts', programDayId] }); setOpen(false); reset(); },
  });

  function reset() { setName('New Workout'); setExercises([blankExercise()]); setTemplateId(''); setSaveToLibrary(false); }
  function close() { if (saveNew.isPending || useTemplate.isPending) return; setOpen(false); reset(); }
  function patchExercise(index: number, patch: Partial<DraftExerciseData>) { setExercises((current) => current.map((exercise, i) => i === index ? { ...exercise, ...patch } : exercise)); }

  return <div className="stack" style={{ marginTop: '0.5rem' }}>
    <strong style={{ fontSize: '0.9rem' }}>Workouts</strong>
    {(workouts ?? []).map((workout) => <WorkoutCard key={workout.id} workout={workout} programDayId={programDayId} playerId={playerId} coachId={coachId} currentWeek={currentWeek} totalWeeks={totalWeeks} />)}
    <button className="secondary" type="button" onClick={() => setOpen(true)}>+ Add workout</button>

    {open && <div className="workout-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="workout-modal" role="dialog" aria-modal="true" aria-labelledby="add-workout-title">
        <header><h2 id="add-workout-title">Add Workout</h2><button type="button" className="modal-close" aria-label="Close" onClick={close}>×</button></header>
        <div className="workout-modal-body">
          {templates.length > 0 && <div className="workout-library-choice"><div className="field"><label>Use a saved workout</label><select value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Create a new workout</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></div>{templateId && <button type="button" onClick={() => useTemplate.mutate()} disabled={useTemplate.isPending}>{useTemplate.isPending ? 'Adding…' : 'Add saved workout'}</button>}</div>}
          {!templateId && <>
            <div className="field"><label>Workout name</label><input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></div>
            <div className="modal-exercise-heading"><strong>Exercises</strong><button type="button" className="secondary" onClick={() => setExercises((current) => [...current, blankExercise()])}>+ Exercise</button></div>
            {exercises.map((exercise, index) => <div className="modal-exercise-card" key={index}>
              <div className="modal-exercise-title"><strong>Exercise {index + 1}</strong>{exercises.length > 1 && <button type="button" className="modal-remove" onClick={() => setExercises((current) => current.filter((_, i) => i !== index))}>Remove</button>}</div>
              <div className="field"><label>Exercise name</label><input value={exercise.name} onChange={(event) => patchExercise(index, { name: event.target.value })} placeholder="Chest Press" maxLength={160} /></div>
              <div className="modal-target-grid"><div className="field"><label>Target sets</label><input type="number" min="1" max="100" value={exercise.target_sets ?? ''} onChange={(event) => patchExercise(index, { target_sets: event.target.value ? Number(event.target.value) : null })} /></div><div className="field"><label>Target reps</label><input value={exercise.target_reps ?? ''} onChange={(event) => patchExercise(index, { target_reps: event.target.value || null })} placeholder="8-12" /></div><div className="field"><label>Target weight</label><input value={exercise.target_weight ?? ''} onChange={(event) => patchExercise(index, { target_weight: event.target.value || null })} placeholder="60 kg" /></div></div>
              <div className="field"><label>Coach notes (optional)</label><textarea rows={2} value={exercise.coach_comment ?? ''} onChange={(event) => patchExercise(index, { coach_comment: event.target.value || null })} placeholder="Technique, tempo, or rest instructions" maxLength={5000} /></div>
              <VideoInput ownerId={playerId} value={{ url: exercise.coach_video_url, isExternal: exercise.coach_video_is_external }} onChange={(video) => patchExercise(index, { coach_video_url: video.url, coach_video_is_external: video.isExternal })} />
            </div>)}
            <label className="modal-library-check"><input type="checkbox" checked={saveToLibrary} onChange={(event) => setSaveToLibrary(event.target.checked)} /><span><strong>Save to workout library</strong><small>Keep one reusable copy for other players.</small></span></label>
          </>}
          {(saveNew.error || useTemplate.error) && <p className="error">{((saveNew.error || useTemplate.error) as Error).message}</p>}
        </div>
        <footer><button type="button" className="secondary" onClick={close}>Cancel</button>{!templateId && <button type="button" onClick={() => saveNew.mutate()} disabled={saveNew.isPending}>{saveNew.isPending ? 'Saving…' : 'Save workout'}</button>}</footer>
      </section>
    </div>}
  </div>;
}
