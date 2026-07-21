/** Loads and saves today's set-by-set player performance for one exercise. */
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getLog, upsertLog } from '../../../api/logs';
import { listSetLogs, replaceSetLogs } from '../../../api/setLogs';
import { listMessagesForExercise } from '../../../api/messages';
import type { Exercise } from '../../../types/database.types';
import VideoInput, { type VideoValue } from '../../../components/VideoInput';
import VideoPlayer from '../../../components/VideoPlayer';
import ActionButtonContent from '../../../components/ActionButtonContent';

export default function ExerciseBody({
  exercise,
  playerId,
  logDate,
  locked = false,
  onCompleted,
}: {
  exercise: Exercise;
  playerId: string;
  logDate: string;
  locked?: boolean;
  onCompleted?: () => void;
}) {
  const qc = useQueryClient();

  const { data: log } = useQuery({
    queryKey: ['log', exercise.id, playerId, logDate],
    queryFn: () => getLog(exercise.id, playerId, logDate),
  });
  const { data: existingSets } = useQuery({
    queryKey: ['setlogs', log?.id],
    queryFn: () => (log?.id ? listSetLogs(log.id) : Promise.resolve([])),
    enabled: !!log?.id,
  });
  const { data: messages } = useQuery({
    queryKey: ['exmsg', exercise.id],
    queryFn: () => listMessagesForExercise(exercise.id),
  });

  // Per-set state: one row per set with reps + weight.
  type SetRow = { reps: string; weight: string };
  const targetCount = Math.max(1, exercise.target_sets ?? 1);
  const [rows, setRows] = useState<SetRow[]>(() =>
    Array.from({ length: targetCount }, () => ({ reps: '', weight: '' }))
  );
  const [comment, setComment] = useState('');
  const [video, setVideo] = useState<VideoValue>({ url: null, isExternal: false });
  const [initialized, setInitialized] = useState(false);

  // Hydrate from existing DB rows once loaded.
  if (log && !initialized && (existingSets !== undefined)) {
    if (existingSets.length > 0) {
      setRows(existingSets.map((s) => ({ reps: s.reps ?? '', weight: s.weight ?? '' })));
    } else if (log.actual_weight || log.actual_reps) {
      // Backward compat: a pre-per-set log with just summary columns. Seed one
      // row from the summary so the player doesn't lose it.
      setRows([{ reps: log.actual_reps ?? '', weight: log.actual_weight ?? '' }]);
    }
    setComment(log.player_comment ?? '');
    setVideo({ url: log.player_video_url, isExternal: log.player_video_is_external });
    setInitialized(true);
  }

  const setField = (i: number, patch: Partial<SetRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, { reps: '', weight: '' }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const save = useMutation({
    mutationFn: async (completed: boolean) => {
      // Upsert the parent first to guarantee we have a log id. The trigger will
      // rewrite actual_sets/actual_reps/actual_weight from the child rows once
      // we replace them below.
      const parent = await upsertLog({
        exercise_id: exercise.id,
        player_id: playerId,
        log_date: logDate,
        actual_sets: rows.length,
        actual_reps: null,
        actual_weight: null,
        player_comment: comment || null,
        player_video_url: video.url,
        player_video_is_external: video.isExternal,
        is_completed: completed,
      });
      await replaceSetLogs(
        parent.id,
        rows.map((r) => ({ reps: r.reps || null, weight: r.weight || null }))
      );
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['log', exercise.id, playerId, logDate] }),
        qc.invalidateQueries({ queryKey: ['setlogs', log?.id] }),
      ]);
      onCompleted?.();
    },
  });

  const done = log?.is_completed ?? false;

  return (
    <div className="stack">
      {(exercise.target_weight || exercise.target_sets || exercise.target_reps) && (
        <div className="muted" style={{ fontSize: '0.85rem' }}>
          Target: {exercise.target_sets ?? '—'} sets × {exercise.target_reps ?? '—'} reps
          {exercise.target_weight ? ` @ ${exercise.target_weight}` : ''}
        </div>
      )}
      {exercise.coach_comment && (
        <p style={{ margin: 0 }}>
          <span className="muted">Coach: </span>
          {exercise.coach_comment}
        </p>
      )}
      {exercise.coach_video_url && (
        <div>
          <span className="muted" style={{ fontSize: '0.8rem' }}>Coach's demo:</span>
          <VideoPlayer url={exercise.coach_video_url} isExternal={exercise.coach_video_is_external} />
        </div>
      )}
      {messages && messages.length > 0 && (
        <div className="stack" style={{ gap: '0.3rem' }}>
          {messages.map((m) => (
            <div key={m.id} className="muted" style={{ fontSize: '0.85rem' }}>💬 {m.body}</div>
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
        <strong style={{ fontSize: '0.85rem' }}>Log each set</strong>

        <div className="stack" style={{ marginTop: '0.5rem', gap: '0.4rem' }}>
          {rows.map((r, i) => (
            <div key={i} className="row" style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ minWidth: '3.5rem', fontWeight: 600 }}>Set {i + 1}</div>
              <div className="field" style={{ margin: 0, flex: 1 }}>
                <label>Reps</label>
                <input
                  value={r.reps}
                  disabled={locked}
                  onChange={(e) => setField(i, { reps: e.target.value })}
                  placeholder={exercise.target_reps ?? ''}
                />
              </div>
              <div className="field" style={{ margin: 0, flex: 1 }}>
                <label>Weight</label>
                <input
                  value={r.weight}
                  disabled={locked}
                  onChange={(e) => setField(i, { weight: e.target.value })}
                  placeholder={exercise.target_weight ?? '60kg'}
                />
              </div>
              {rows.length > 1 && (
                <button className="secondary" type="button" disabled={locked} onClick={() => removeRow(i)} title="Remove this set">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button className="secondary" type="button" disabled={locked} onClick={addRow} style={{ marginTop: '0.4rem' }}>
          <ActionButtonContent>Add set</ActionButtonContent>
        </button>

        <div className="field" style={{ margin: '0.7rem 0 0' }}>
          <label>Your comment</label>
          <textarea rows={2} value={comment} disabled={locked} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <VideoInput ownerId={playerId} value={video} onChange={setVideo} disabled={locked} />
        </div>
        <div className="row" style={{ marginTop: '0.7rem' }}>
          <button onClick={() => save.mutate(true)} disabled={save.isPending || locked}>
            <ActionButtonContent action="save exercise">{save.isPending ? 'Saving…' : done ? 'Save exercise changes' : 'Save exercise'}</ActionButtonContent>
          </button>
          {save.error && <span className="error">{(save.error as Error).message}</span>}
        </div>
      </div>
    </div>
  );
}
