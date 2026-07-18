/** Lists and creates exercises belonging to one workout assignment. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listExercises, createExercise } from '../../../api/exercises';
import ExerciseRow from './ExerciseRow';

export default function ExerciseEditor({
  workoutId, playerId, coachId, currentWeek, totalWeeks,
}: {
  workoutId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number;
}) {
  const qc = useQueryClient();
  const { data: exercises } = useQuery({
    queryKey: ['exercises', workoutId],
    queryFn: () => listExercises(workoutId),
  });

  const addEx = useMutation({
    mutationFn: () =>
      createExercise({
        workout_id: workoutId,
        name: 'New exercise',
        target_sets: 3,
        target_reps: '10',
        target_weight: null,
        coach_video_url: null,
        coach_video_is_external: false,
        coach_comment: null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises', workoutId] }),
  });

  return (
    <div className="stack" style={{ marginTop: '0.3rem' }}>
      {(exercises ?? []).map((ex) => (
        <ExerciseRow
          key={ex.id}
          exercise={ex}
          playerId={playerId}
          workoutId={workoutId}
          coachId={coachId}
          currentWeek={currentWeek}
          totalWeeks={totalWeeks}
        />
      ))}
      <button className="secondary" onClick={() => addEx.mutate()} disabled={addEx.isPending}>
        + Add exercise
      </button>
    </div>
  );
}

