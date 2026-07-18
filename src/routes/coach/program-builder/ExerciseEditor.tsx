/** Lists and creates exercises belonging to one workout assignment. */
import { useQuery } from '@tanstack/react-query';
import { listExercises } from '../../../api/exercises';
import ExerciseRow from './ExerciseRow';

export default function ExerciseEditor({
  workoutId, playerId, coachId, currentWeek, totalWeeks,
}: {
  workoutId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number;
}) {
  const { data: exercises } = useQuery({
    queryKey: ['exercises', workoutId],
    queryFn: () => listExercises(workoutId),
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
    </div>
  );
}
