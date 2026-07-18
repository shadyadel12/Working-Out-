/** Edits, deletes, and duplicates one player-specific exercise assignment. */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateExercise, deleteExercise } from '../../../api/exercises';
import { duplicateExerciseToWeeks } from '../../../api/programs';
import type { Exercise } from '../../../types/database.types';
import VideoInput, { type VideoValue } from '../../../components/VideoInput';
import WeekPicker from '../../../components/WeekPicker';

export default function ExerciseRow({
  exercise,
  playerId,
  workoutId,
  coachId,
  currentWeek,
  totalWeeks,
}: {
  exercise: Exercise;
  playerId: string;
  workoutId: string;
  coachId: string;
  currentWeek: number;
  totalWeeks: number;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(exercise.name);
  const [sets, setSets] = useState(exercise.target_sets?.toString() ?? '');
  const [reps, setReps] = useState(exercise.target_reps ?? '');
  const [weight, setWeight] = useState(exercise.target_weight ?? '');
  const [comment, setComment] = useState(exercise.coach_comment ?? '');
  const [video, setVideo] = useState<VideoValue>({
    url: exercise.coach_video_url,
    isExternal: exercise.coach_video_is_external,
  });

  const save = useMutation({
    mutationFn: () =>
      updateExercise(exercise.id, {
        name,
        target_sets: sets ? Number(sets) : null,
        target_reps: reps || null,
        target_weight: weight || null,
        coach_comment: comment || null,
        coach_video_url: video.url,
        coach_video_is_external: video.isExternal,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', workoutId] }),
  });

  const del = useMutation({
    mutationFn: () => deleteExercise(exercise.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', workoutId] }),
  });

  const [dupOpen, setDupOpen] = useState(false);
  const dupEx = useMutation({
    mutationFn: (targetWeeks: number[]) =>
      duplicateExerciseToWeeks(playerId, coachId, exercise.id, targetWeeks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['program', playerId] });
      setDupOpen(false);
    },
  });

  return (
    <div className="card stack" style={{ background: 'var(--surface)' }}>
      <div className="field" style={{ margin: 0 }}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="row">
        <div className="field" style={{ margin: 0, flex: 1 }}>
          <label>Target sets</label>
          <input type="number" value={sets} onChange={(e) => setSets(e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0, flex: 1 }}>
          <label>Target reps</label>
          <input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8-12" />
        </div>
        <div className="field" style={{ margin: 0, flex: 1 }}>
          <label>Target weight</label>
          <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="60kg" />
        </div>
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label>Comment</label>
        <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <VideoInput ownerId={playerId} value={video} onChange={setVideo} />
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        <button className="secondary" type="button" onClick={() => setDupOpen((o) => !o)}>
          {dupOpen ? 'Cancel' : 'Duplicate…'}
        </button>
        <button className="danger" onClick={() => del.mutate()} disabled={del.isPending}>
          Delete
        </button>
        {save.error && <span className="error">{(save.error as Error).message}</span>}
      </div>
      {dupOpen && (
        <WeekPicker
          excludeWeek={currentWeek}
          totalWeeks={totalWeeks}
          busy={dupEx.isPending}
          onDuplicate={(weeks) => dupEx.mutate(weeks)}
          onCancel={() => setDupOpen(false)}
          label={`Copy "${exercise.name}" to (same day, weeks)`}
        />
      )}
      {dupEx.error && <span className="error">{(dupEx.error as Error).message}</span>}
      {dupEx.isSuccess && (
        <span className="badge active">Duplicated to {dupEx.data} week{dupEx.data === 1 ? '' : 's'} ✓</span>
      )}
    </div>
  );
}
