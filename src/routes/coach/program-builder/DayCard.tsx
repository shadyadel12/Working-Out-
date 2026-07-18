/** Edits one program day and coordinates its draft/live workout editors. */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertProgramDay, createFullDay, duplicateDayToWeeks, type DraftWorkoutData } from '../../../api/programs';
import type { ProgramDay } from '../../../types/database.types';
import WeekPicker from '../../../components/WeekPicker';
import DraftWorkoutsEditor from './DraftWorkoutsEditor';
import WorkoutList from './WorkoutList';

export default function DayCard({
  playerId,
  coachId,
  week,
  dayOfWeek,
  dayName,
  existing,
  totalWeeks,
}: {
  playerId: string;
  coachId: string;
  week: number;
  dayOfWeek: number;
  dayName: string;
  existing: ProgramDay | null;
  totalWeeks: number;
}) {
  const qc = useQueryClient();
  const [dayType, setDayType] = useState(existing?.day_type ?? 'training');
  // Draft workouts (each with draft exercises) for a not-yet-created day.
  const [draftWorkouts, setDraftWorkouts] = useState<DraftWorkoutData[]>([]);
  // Duplicate-day picker toggle.
  const [dupOpen, setDupOpen] = useState(false);
  const dupDay = useMutation({
    mutationFn: (targetWeeks: number[]) =>
      duplicateDayToWeeks(playerId, coachId, week, dayOfWeek, targetWeeks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['program', playerId] });
      setDupOpen(false);
    },
  });

  const saveDay = useMutation({
    mutationFn: async () => {
      const base = {
        player_id: playerId,
        coach_id: coachId,
        week_number: week,
        day_of_week: dayOfWeek,
        day_type: dayType,
        title: existing?.title ?? null,
        diet_plan: existing?.diet_plan ?? null,
      };
      if (!existing && dayType === 'training' && draftWorkouts.length > 0) {
        await createFullDay(base, draftWorkouts);
      } else {
        await upsertProgramDay(base);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['program', playerId] });
      setDraftWorkouts([]);
    },
  });

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <strong>{dayName}</strong>{' '}
          {existing ? (
            <span className="muted">
              Ã¢â‚¬â€ {existing.day_type === 'rest' ? 'Rest day' : 'Training'}
            </span>
          ) : (
            <span className="muted">Ã¢â‚¬â€ not set</span>
          )}
        </div>
        {existing && (
          <button
            type="button"
            className="secondary"
            onClick={() => setDupOpen((o) => !o)}
          >
            {dupOpen ? 'Cancel' : 'Duplicate dayÃ¢â‚¬Â¦'}
          </button>
        )}
      </div>
      {dupOpen && existing && (
        <WeekPicker
          excludeWeek={week}
          totalWeeks={totalWeeks}
          busy={dupDay.isPending}
          onDuplicate={(weeks) => dupDay.mutate(weeks)}
          onCancel={() => setDupOpen(false)}
          label={`Copy ${dayName} of Week ${week} to`}
        />
      )}
      {dupDay.error && <span className="error">{(dupDay.error as Error).message}</span>}
      {dupDay.isSuccess && (
        <span className="badge active">Duplicated to {dupDay.data} week{dupDay.data === 1 ? '' : 's'} Ã¢Å“â€œ</span>
      )}
      <div className="stack" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.9rem' }}>
        <div className="row">
          <label className="row" style={{ gap: '0.4rem' }}>
            <input type="radio" style={{ width: 'auto' }} checked={dayType === 'training'} onChange={() => setDayType('training')} />
            Training day
          </label>
          <label className="row" style={{ gap: '0.4rem' }}>
            <input type="radio" style={{ width: 'auto' }} checked={dayType === 'rest'} onChange={() => setDayType('rest')} />
            Rest day
          </label>
        </div>

        {/* New training day: build workouts + exercises before the first save. */}
        {!existing && dayType === 'training' && (
          <DraftWorkoutsEditor drafts={draftWorkouts} setDrafts={setDraftWorkouts} />
        )}

        <div className="row">
          <button onClick={() => saveDay.mutate()} disabled={saveDay.isPending}>
            {saveDay.isPending ? 'SavingÃ¢â‚¬Â¦' : existing ? 'Save day' : 'Create day'}
          </button>
          {saveDay.error && <span className="error">{(saveDay.error as Error).message}</span>}
        </div>

        {/* Existing training day: live workout editor. */}
        {existing && dayType === 'training' && (
          <WorkoutList
            programDayId={existing.id}
            playerId={playerId}
            coachId={coachId}
            currentWeek={week}
            totalWeeks={totalWeeks}
          />
        )}
      </div>
    </div>
  );
}

// ---- Draft editors (for a day that doesn't exist in the DB yet) ----

