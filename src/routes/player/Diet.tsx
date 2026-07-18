import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { DAY_NAMES, DAY_SHORT, WEEK_ORDER_SAT_FIRST, todayDayOfWeek } from '../../lib/dates';
import { listDietDays } from '../../api/diet';
import { saveDietLog } from '../../api/dietProgress';
import type { DietDay } from '../../types/database.types';
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function PlayerDiet() {
  const { session, profile } = useAuth();
  const playerId = session!.user.id;
  const [week, setWeek] = useState(1);

  const { data: dietDays, isLoading } = useQuery({
    queryKey: ['diet', playerId],
    queryFn: () => listDietDays(playerId),
  });

  const weeks = Array.from(new Set((dietDays ?? []).map((d) => d.week_number))).sort((a, b) => a - b);
  const weekDays = (dietDays ?? []).filter((d) => d.week_number === week);
  const byDow = new Map(weekDays.map((d) => [d.day_of_week, d]));

  const [selectedDow, setSelectedDow] = useState<number>(todayDayOfWeek());
  const selectedDay = byDow.get(selectedDow) ?? null;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Week {week}: Diet plan for {profile?.name ?? 'you'}</h1>
        {weeks.length > 0 && (
          <div className="field" style={{ margin: 0, minWidth: 120 }}>
            <label>Week</label>
            <select value={week} onChange={(e) => setWeek(Number(e.target.value))}>
              {weeks.map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading && <LoadingSkeleton rows={6} />}

      {!isLoading && weekDays.length === 0 && (
        <div className="card">
          <p className="muted">No diet plan set for this week yet. Check back soon.</p>
        </div>
      )}

      {weekDays.length > 0 && (
        <>
          <div className="day-tabs">
            {WEEK_ORDER_SAT_FIRST.map((dow) => {
              const has = byDow.has(dow);
              const active = dow === selectedDow;
              return (
                <button
                  key={dow}
                  type="button"
                  className={`day-tab ${active ? 'active' : ''} ${has ? 'has-plan' : ''}`}
                  onClick={() => setSelectedDow(dow)}
                >
                  {DAY_SHORT[dow]}
                </button>
              );
            })}
          </div>

          {selectedDay ? (
            <div className="card stack" style={{ gap: '0.6rem' }}>
              <strong>{DAY_NAMES[selectedDay.day_of_week]}</strong>
              {selectedDay.meals.map((m, i) => (
                <div
                  key={i}
                  className="card stack"
                  style={{
                    background: 'var(--surface-2)',
                    gap: '0.3rem',
                    borderLeft: m.type === 'snack' ? '3px solid var(--warning, #fbbf24)' : '3px solid var(--accent)',
                  }}
                >
                  <strong style={{ fontSize: '0.9rem' }}>{m.label}</strong>
                  {(m.items ?? []).length > 0 ? (
                    <div className="stack" style={{ gap: '0.25rem' }}>
                      {(m.items ?? []).map((it, j) => (
                        <div
                          key={j}
                          className="row"
                          style={{ justifyContent: 'space-between', fontSize: '0.92rem' }}
                        >
                          <span>{it.food}</span>
                          <span className="muted">{it.grams ? `${it.grams} g` : ''}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem' }}>
                      {m.content || <span className="muted">—</span>}
                    </div>
                  )}
                </div>
              ))}
              {selectedDay.comment && (
                <div
                  className="card"
                  style={{
                    background: 'var(--surface-2)',
                    borderLeft: '3px solid var(--text-dim)',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.92rem',
                  }}
                >
                  <span className="muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.3rem' }}>
                    Coach note
                  </span>
                  {selectedDay.comment}
                </div>
              )}
              {selectedDay.meals.length > 0 && <DietCheckIn day={selectedDay} />}
            </div>
          ) : (
            <div className="card">
              <p className="muted">No diet set for {DAY_NAMES[selectedDow]}.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DietCheckIn({ day }: { day: DietDay }) {
  const qc = useQueryClient();
  const [done, setDone] = useState<boolean[]>(() => day.meals.map(() => false));
  const [comment, setComment] = useState('');
  const save = useMutation({
    mutationFn: () => saveDietLog(day, done.filter(Boolean).length, comment),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['diet-progress', day.player_id] }); },
  });
  return <div className="card stack" style={{ borderLeft: '3px solid var(--success)' }}>
    <strong>Today’s diet check-in</strong>
    <span className="muted" style={{ fontSize: '0.85rem' }}>Tick each meal you followed, then save.</span>
    {day.meals.map((meal, index) => <label key={index} className="row" style={{ justifyContent: 'flex-start' }}><input type="checkbox" checked={done[index]} onChange={(e) => setDone((current) => current.map((value, i) => i === index ? e.target.checked : value))} /> {meal.label}</label>)}
    <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={5000} placeholder="Optional note for your coach" rows={2} />
    <button type="button" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save today’s progress'}</button>
    {save.isSuccess && <span style={{ color: 'var(--success)' }}>Diet progress saved.</span>}
    {save.error && <span className="error">{(save.error as Error).message}</span>}
  </div>;
}
