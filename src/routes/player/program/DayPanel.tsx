/** Displays the workouts scheduled for one player program day. */
import { useQuery } from '@tanstack/react-query';
import { listWorkouts } from '../../../api/workouts';
import type { ProgramDay } from '../../../types/database.types';
import WorkoutAccordion from './WorkoutAccordion';
import { DAY_NAMES } from '../../../lib/dates';

export default function DayPanel({ day, playerId }: { day: ProgramDay; playerId: string }) {
  const { data: workouts } = useQuery({
    queryKey: ['workouts', day.id],
    queryFn: () => listWorkouts(day.id),
    enabled: day.day_type === 'training',
  });

  return (
    <div className="card stack" style={{ gap: '0.5rem' }}>
      <div>
        <strong>{DAY_NAMES[day.day_of_week]}</strong>
        <span className="muted"> â€” {day.day_type === 'rest' ? 'Rest day' : 'Training'}</span>
      </div>

      {day.day_type === 'training' &&
        (workouts ?? []).map((w) => (
          <WorkoutAccordion key={w.id} workout={w} playerId={playerId} />
        ))}
      {day.day_type === 'training' && (workouts ?? []).length === 0 && (
        <p className="muted" style={{ fontSize: '0.85rem' }}>No workouts for this day.</p>
      )}
    </div>
  );
}

/** Level 2: a workout within a day. Collapsed by default. */
