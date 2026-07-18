/** Builds workouts and exercises before a new program day is first saved. */
import type React from 'react';
import type { DraftWorkoutData } from '../../../api/programs';

export default function DraftWorkoutsEditor({
  drafts,
  setDrafts,
}: {
  drafts: DraftWorkoutData[];
  setDrafts: React.Dispatch<React.SetStateAction<DraftWorkoutData[]>>;
}) {
  const addWorkout = () =>
    setDrafts((ds) => [...ds, { name: '', exercises: [] }]);
  const removeWorkout = (i: number) =>
    setDrafts((ds) => ds.filter((_, idx) => idx !== i));
  const setWorkoutName = (i: number, name: string) =>
    setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, name } : d)));
  const addExercise = (i: number) =>
    setDrafts((ds) =>
      ds.map((d, idx) =>
        idx === i
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                {
                  name: '',
                  target_sets: 3,
                  target_reps: '10',
                  target_weight: null,
                  coach_comment: null,
                  coach_video_url: null,
                  coach_video_is_external: false,
                },
              ],
            }
          : d
      )
    );
  const setExercise = (wi: number, ei: number, patch: Partial<DraftWorkoutData['exercises'][number]>) =>
    setDrafts((ds) =>
      ds.map((d, idx) =>
        idx === wi
          ? { ...d, exercises: d.exercises.map((ex, j) => (j === ei ? { ...ex, ...patch } : ex)) }
          : d
      )
    );
  const removeExercise = (wi: number, ei: number) =>
    setDrafts((ds) =>
      ds.map((d, idx) =>
        idx === wi ? { ...d, exercises: d.exercises.filter((_, j) => j !== ei) } : d
      )
    );

  return (
    <div className="stack" style={{ marginTop: '0.3rem' }}>
      <strong style={{ fontSize: '0.9rem' }}>Workouts</strong>
      {drafts.length === 0 && (
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
          Add workouts and exercises now Ã¢â‚¬â€ they'll be saved together with the day.
        </p>
      )}
      {drafts.map((w, wi) => (
        <div key={wi} className="card stack" style={{ background: 'var(--surface-2)' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="field" style={{ margin: 0, flex: 1 }}>
              <label>Workout name</label>
              <input value={w.name} onChange={(e) => setWorkoutName(wi, e.target.value)} placeholder="Push" />
            </div>
            <button className="danger" style={{ alignSelf: 'flex-end' }} type="button" onClick={() => removeWorkout(wi)}>
              Remove
            </button>
          </div>

          {w.exercises.map((ex, ei) => (
            <div key={ei} className="card stack" style={{ background: 'var(--surface)' }}>
              <div className="field" style={{ margin: 0 }}>
                <label>Exercise name</label>
                <input value={ex.name} onChange={(e) => setExercise(wi, ei, { name: e.target.value })} placeholder="Chest Press" />
              </div>
              <div className="row">
                <div className="field" style={{ margin: 0, flex: 1 }}>
                  <label>Target sets</label>
                  <input
                    type="number"
                    value={ex.target_sets ?? ''}
                    onChange={(e) => setExercise(wi, ei, { target_sets: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="field" style={{ margin: 0, flex: 1 }}>
                  <label>Target reps</label>
                  <input
                    value={ex.target_reps ?? ''}
                    onChange={(e) => setExercise(wi, ei, { target_reps: e.target.value || null })}
                    placeholder="8-12"
                  />
                </div>
                <div className="field" style={{ margin: 0, flex: 1 }}>
                  <label>Target weight</label>
                  <input
                    value={ex.target_weight ?? ''}
                    onChange={(e) => setExercise(wi, ei, { target_weight: e.target.value || null })}
                    placeholder="60kg"
                  />
                </div>
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Comment</label>
                <textarea
                  rows={2}
                  value={ex.coach_comment ?? ''}
                  onChange={(e) => setExercise(wi, ei, { coach_comment: e.target.value || null })}
                />
              </div>
              <button className="danger" type="button" onClick={() => removeExercise(wi, ei)}>
                Remove exercise
              </button>
            </div>
          ))}

          <button className="secondary" type="button" onClick={() => addExercise(wi)}>
            + Add exercise
          </button>
        </div>
      ))}
      <button className="secondary" type="button" onClick={addWorkout}>
        + Add workout
      </button>
    </div>
  );
}

