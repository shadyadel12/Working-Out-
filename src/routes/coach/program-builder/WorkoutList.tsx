/** Lists a day's workouts and creates complete workouts in a focused builder. */
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createExercises } from '../../../api/exercises';
import { createWorkout, deleteWorkout, listWorkouts } from '../../../api/workouts';
import { assignWorkoutTemplate, listWorkoutTemplates, saveWorkoutAsTemplate } from '../../../api/workoutTemplates';
import type { DraftExerciseData } from '../../../api/programs';
import VideoInput from '../../../components/VideoInput';
import WorkoutCard from './WorkoutCard';
import ActionButtonContent from '../../../components/ActionButtonContent';

const blankExercise = (): DraftExerciseData => ({ name: '', target_sets: 3, target_reps: '10', target_weight: null, coach_comment: null, coach_video_url: null, coach_video_is_external: false });

export default function WorkoutList({ programDayId, playerId, coachId, currentWeek, totalWeeks }: { programDayId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('New Workout');
  const [exercises, setExercises] = useState<DraftExerciseData[]>([blankExercise()]);
  const [templateId, setTemplateId] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(0);
  const [sourceSearch, setSourceSearch] = useState('');
  const { data: workouts } = useQuery({ queryKey: ['workouts', programDayId], queryFn: () => listWorkouts(programDayId) });
  const { data: templates = [], isLoading: templatesLoading, error: templatesError } = useQuery({ queryKey: ['workout-templates', coachId], queryFn: () => listWorkoutTemplates(coachId) });

  useEffect(() => { if (!open) return; const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && close(); window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape); });

  const saveNew = useMutation({ mutationFn: async () => { if (!name.trim()) throw new Error('Enter a workout name.'); if (!exercises.length || exercises.some((exercise) => !exercise.name.trim())) throw new Error('Add and name every exercise.'); const workout = await createWorkout(programDayId, name.trim(), workouts?.length ?? 0); try { await createExercises(exercises.map((exercise, position) => ({ ...exercise, name: exercise.name.trim(), workout_id: workout.id, position }))); if (saveToLibrary) await saveWorkoutAsTemplate(workout.id); } catch (error) { await deleteWorkout(workout.id); throw error; } }, onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['workouts', programDayId] }); if (saveToLibrary) await qc.invalidateQueries({ queryKey: ['workout-templates', coachId] }); close(); } });
  const useTemplate = useMutation({ mutationFn: () => assignWorkoutTemplate(programDayId, templateId, workouts?.length ?? 0), onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['workouts', programDayId] }); close(); } });

  function reset() { setName('New Workout'); setExercises([blankExercise()]); setTemplateId(''); setSaveToLibrary(false); setSelectedExercise(0); setSourceSearch(''); }
  function close() { if (saveNew.isPending || useTemplate.isPending) return; setOpen(false); reset(); }
  function patchExercise(index: number, patch: Partial<DraftExerciseData>) { setExercises((current) => current.map((exercise, i) => i === index ? { ...exercise, ...patch } : exercise)); }
  function addExercise() { setExercises((current) => [...current, blankExercise()]); setSelectedExercise(exercises.length); }
  function removeExercise(index: number) { setExercises((current) => current.filter((_, i) => i !== index)); setSelectedExercise((current) => Math.max(0, Math.min(current, exercises.length - 2))); }
  function moveExercise(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= exercises.length) return; setExercises((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; }); setSelectedExercise(target); }
  const selected = exercises[selectedExercise];
  const visibleTemplates = templates.filter((item) => item.name.toLowerCase().includes(sourceSearch.toLowerCase()));

  return <div className="stack" style={{ marginTop: '0.5rem' }}>
    <strong style={{ fontSize: '0.9rem' }}>Workouts</strong>
    {(workouts ?? []).map((workout) => <WorkoutCard key={workout.id} workout={workout} programDayId={programDayId} playerId={playerId} coachId={coachId} currentWeek={currentWeek} totalWeeks={totalWeeks} />)}
    <button className="secondary" type="button" onClick={() => setOpen(true)}>+ Add workout</button>
    {open && <div className="workout-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="workout-modal player-training-builder" role="dialog" aria-modal="true" aria-labelledby="add-workout-title">
        <header><div><h2 id="add-workout-title">Build player workout</h2><small>Arrange exercises, then edit the selected prescription.</small></div><button type="button" className="modal-close" aria-label="Close builder" onClick={close}>×</button></header>
        <div className="workout-modal-body player-builder-body">
          <div className="player-builder-meta"><div className="field"><label htmlFor="player-workout-name">Workout name</label><input id="player-workout-name" autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></div><label className="modal-library-check"><input type="checkbox" checked={saveToLibrary} onChange={(event) => setSaveToLibrary(event.target.checked)} /><span><strong>Save to library</strong><small>Reuse with other players.</small></span></label></div>
          {templatesLoading && <small className="muted">Loading saved workouts…</small>}
          {templatesError && <p className="error">Could not load saved workouts. Please try again.</p>}
          <div className="player-builder-grid">
            <aside className="player-builder-sources" aria-label="Workout sources"><h3>Library</h3><input aria-label="Search saved workouts" placeholder="Search saved workouts" value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} /><div className="player-source-list">{visibleTemplates.map((template) => <button type="button" className={templateId === template.id ? 'selected' : ''} key={template.id} onClick={() => setTemplateId(template.id)}><span><strong>{template.name}</strong><small>Saved workout</small></span><span aria-hidden="true">+</span></button>)}</div>{templateId && <button type="button" onClick={() => useTemplate.mutate()} disabled={useTemplate.isPending}>{useTemplate.isPending ? 'Adding…' : 'Add selected workout'}</button>}<div className="player-quick-add"><h4>Build from scratch</h4><button type="button" className="secondary" onClick={addExercise}>+ Blank exercise</button></div></aside>
            <main className="player-builder-canvas"><div className="training-canvas-heading"><div><h3>Arrangement</h3><span>{exercises.length} exercise{exercises.length === 1 ? '' : 's'}</span></div><button type="button" className="secondary" onClick={addExercise}>+ Exercise</button></div><ol>{exercises.map((exercise, index) => <li key={index} className={selectedExercise === index ? 'selected' : ''}><button type="button" className="training-item-main" onClick={() => setSelectedExercise(index)}><span className="training-item-index">{index + 1}</span><span><strong>{exercise.name || 'Untitled exercise'}</strong><small>{exercise.target_sets || 0} sets · {exercise.target_reps || 'No reps'} · {exercise.target_weight || 'No load'}</small></span></button><div className="training-item-actions"><button type="button" className="secondary" aria-label={`Move ${exercise.name || 'exercise'} up`} disabled={index === 0} onClick={() => moveExercise(index, -1)}>↑</button><button type="button" className="secondary" aria-label={`Move ${exercise.name || 'exercise'} down`} disabled={index === exercises.length - 1} onClick={() => moveExercise(index, 1)}>↓</button>{exercises.length > 1 && <button type="button" className="danger" aria-label={`Remove ${exercise.name || 'exercise'}`} onClick={() => removeExercise(index)}>×</button>}</div></li>)}</ol></main>
            <aside className="player-builder-inspector" aria-label="Exercise prescription">{selected ? <><h3>Prescription</h3><div className="field"><label>Exercise name</label><input value={selected.name} onChange={(event) => patchExercise(selectedExercise, { name: event.target.value })} placeholder="Chest Press" maxLength={160} /></div><div className="modal-target-grid"><div className="field"><label>Sets</label><input type="number" min="1" max="100" value={selected.target_sets ?? ''} onChange={(event) => patchExercise(selectedExercise, { target_sets: event.target.value ? Number(event.target.value) : null })} /></div><div className="field"><label>Reps</label><input value={selected.target_reps ?? ''} onChange={(event) => patchExercise(selectedExercise, { target_reps: event.target.value || null })} placeholder="8-12" /></div><div className="field"><label>Weight</label><input value={selected.target_weight ?? ''} onChange={(event) => patchExercise(selectedExercise, { target_weight: event.target.value || null })} placeholder="60 kg" /></div></div><div className="field"><label>Coach notes</label><textarea rows={3} value={selected.coach_comment ?? ''} onChange={(event) => patchExercise(selectedExercise, { coach_comment: event.target.value || null })} placeholder="Technique, tempo, or rest instructions" maxLength={5000} /></div><VideoInput ownerId={playerId} value={{ url: selected.coach_video_url, isExternal: selected.coach_video_is_external }} onChange={(video) => patchExercise(selectedExercise, { coach_video_url: video.url, coach_video_is_external: video.isExternal })} /></> : <p className="muted">Select an exercise to edit it.</p>}</aside>
          </div>
          {(saveNew.error || useTemplate.error) && <p className="error">{((saveNew.error || useTemplate.error) as Error).message}</p>}
        </div>
        <footer><span className="muted">{exercises.filter((item) => item.name.trim()).length}/{exercises.length} exercises ready</span><div><button type="button" className="secondary" onClick={close}><ActionButtonContent>Cancel</ActionButtonContent></button><button type="button" onClick={() => saveNew.mutate()} disabled={saveNew.isPending || !name.trim() || exercises.some((item) => !item.name.trim())}><ActionButtonContent action="save workout">{saveNew.isPending ? 'Saving…' : 'Save workout'}</ActionButtonContent></button></div></footer>
      </section>
    </div>}
  </div>;
}
