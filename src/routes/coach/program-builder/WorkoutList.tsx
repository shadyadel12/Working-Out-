/** Lists a day's workouts and lets the coach add new or library workouts. */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listWorkouts, createWorkout } from '../../../api/workouts';
import { assignWorkoutTemplate, listWorkoutTemplates } from '../../../api/workoutTemplates';
import WorkoutCard from './WorkoutCard';

export default function WorkoutList({
  programDayId, playerId, coachId, currentWeek, totalWeeks,
}: {
  programDayId: string; playerId: string; coachId: string; currentWeek: number; totalWeeks: number;
}) {
  const qc = useQueryClient();
  const [templateId, setTemplateId] = useState('');
  const { data: workouts } = useQuery({
    queryKey: ['workouts', programDayId],
    queryFn: () => listWorkouts(programDayId),
  });

  const addWorkout = useMutation({
    mutationFn: () => createWorkout(programDayId, 'New workout', (workouts?.length ?? 0)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts', programDayId] }),
  });
  const { data: templates = [] } = useQuery({
    queryKey: ['workout-templates', coachId],
    queryFn: () => listWorkoutTemplates(coachId),
  });
  const useTemplate = useMutation({
    mutationFn: () => assignWorkoutTemplate(programDayId, templateId, workouts?.length ?? 0),
    onSuccess: () => {
      setTemplateId('');
      qc.invalidateQueries({ queryKey: ['workouts', programDayId] });
    },
  });

  return (
    <div className="stack" style={{ marginTop: '0.5rem' }}>
      <strong style={{ fontSize: '0.9rem' }}>Workouts</strong>
      {(workouts ?? []).map((w) => (
        <WorkoutCard
          key={w.id}
          workout={w}
          programDayId={programDayId}
          playerId={playerId}
          coachId={coachId}
          currentWeek={currentWeek}
          totalWeeks={totalWeeks}
        />
      ))}
      {templates.length > 0 && <div className="card row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0, flex: 1, minWidth: 180 }}>
          <label>Use saved workout</label>
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Select from library…</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>
        </div>
        <button type="button" disabled={!templateId || useTemplate.isPending} onClick={() => useTemplate.mutate()}>{useTemplate.isPending ? 'Adding…' : 'Add to this player'}</button>
        {useTemplate.error && <span className="error">{(useTemplate.error as Error).message}</span>}
      </div>}
      <button className="secondary" onClick={() => addWorkout.mutate()} disabled={addWorkout.isPending}>
        + Add workout
      </button>
    </div>
  );
}
