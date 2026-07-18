import { useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { DAY_NAMES, DAY_SHORT, WEEK_ORDER_SAT_FIRST, todayDayOfWeek } from '../../lib/dates';
import { getPlayerForCoach } from '../../api/players';
import {
  listProgramDays,
  duplicateWeek,
} from '../../api/programs';
import DayCard from './program-builder/DayCard';

export default function ProgramBuilder() {
  const { playerId } = useParams<{ playerId: string }>();
  const { session } = useAuth();
  const coachId = session!.user.id;
  const [week, setWeek] = useState(1);

  const { data: player } = useQuery({
    queryKey: ['player', coachId, playerId],
    queryFn: () => getPlayerForCoach(coachId, playerId!),
    enabled: !!playerId,
  });

  // Total program weeks derived from the player's subscription window.
  // Falls back to 12 if the link isn't loaded yet.
  const totalWeeks = (() => {
    const link = player?.link;
    if (!link) return 12;
    const start = new Date(link.created_at);
    const end = new Date(link.subscription_end_date);
    const days = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(days / 7));
  })();

  const { data: days } = useQuery({
    queryKey: ['program', playerId],
    queryFn: () => listProgramDays(playerId!),
    enabled: !!playerId,
  });

  const weekDays = (days ?? []).filter((d) => d.week_number === week);
  const byDow = new Map(weekDays.map((d) => [d.day_of_week, d]));
  const qc = useQueryClient();

  // Which day tab is active. Defaults to today's weekday.
  const [selectedDow, setSelectedDow] = useState<number>(todayDayOfWeek());
  const selectedExisting = byDow.get(selectedDow) ?? null;

  const [dupN, setDupN] = useState(1);
  const duplicate = useMutation({
    mutationFn: async () => {
      const targets = Array.from({ length: dupN }, (_, i) => week + 1 + i);
      for (const t of targets) await duplicateWeek(playerId!, coachId, week, t);
      return dupN;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['program', playerId] }),
  });

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <BackButton />
          <h1 style={{ margin: '0.2rem 0 0' }}>
            Program — {player?.profile?.name ?? player?.profile?.email ?? '…'}
          </h1>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 120 }}>
          <label>Week</label>
          <select value={week} onChange={(e) => setWeek(Number(e.target.value))}>
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Week {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {weekDays.length > 0 && (
        <div className="card row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Copy Week {week}'s full schedule to the next N weeks (overwrites target weeks):
          </span>
          <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={dupN}
              onChange={(e) => setDupN(Number(e.target.value))}
              style={{ width: 'auto' }}
              disabled={duplicate.isPending}
            >
              {Array.from({ length: totalWeeks - week }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} week{n === 1 ? '' : 's'}
                </option>
              ))}
            </select>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              → W{week + 1}{dupN > 1 ? `–W${week + dupN}` : ''}
            </span>
            <button
              onClick={() => {
                if (confirm(`Copy Week ${week} to the next ${dupN} week${dupN === 1 ? '' : 's'}? This overwrites those weeks.`)) {
                  duplicate.mutate();
                }
              }}
              disabled={duplicate.isPending || week >= totalWeeks}
            >
              {duplicate.isPending ? 'Copying…' : 'Duplicate week'}
            </button>
          </div>
          {duplicate.isSuccess && (
            <span className="badge active">Copied to {duplicate.data} week{duplicate.data === 1 ? '' : 's'} ✓</span>
          )}
          {duplicate.error && <span className="error">{(duplicate.error as Error).message}</span>}
        </div>
      )}

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

      <DayCard
        key={`${week}-${selectedDow}`}
        playerId={playerId!}
        coachId={coachId}
        week={week}
        dayOfWeek={selectedDow}
        dayName={DAY_NAMES[selectedDow]}
        existing={selectedExisting}
        totalWeeks={totalWeeks}
      />
    </div>
  );
}
