import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { DAY_NAMES, DAY_SHORT, WEEK_ORDER_SAT_FIRST, currentProgramWeek, todayDayOfWeek } from '../../lib/dates';
import { getPlayerForCoach } from '../../api/players';
import {
  listDietDays,
  duplicateDietWeek,
} from '../../api/diet';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import DietDayCard from './diet/DietDayCard';

export default function CoachDiet() {
  const { playerId } = useParams<{ playerId: string }>();
  const { session } = useAuth();
  const coachId = session!.user.id;
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [week, setWeek] = useState(1);
  const qc = useQueryClient();

  const { data: player } = useQuery({
    queryKey: ['player', coachId, playerId],
    queryFn: () => getPlayerForCoach(coachId, playerId!),
    enabled: !!playerId,
  });

  const totalWeeks = (() => {
    const link = player?.link;
    if (!link) return 12;
    const start = new Date(link.created_at);
    const end = new Date(link.subscription_end_date);
    const days = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(days / 7));
  })();
  const weekInitialized = useRef(false);
  useEffect(() => {
    if (weekInitialized.current || !player?.link) return;
    const current = currentProgramWeek(player.link.created_at, totalWeeks);
    setSelectedWeek(current);
    setWeek(current);
    weekInitialized.current = true;
  }, [player, totalWeeks]);

  const { data: dietDays, isLoading: dietLoading } = useQuery({
    queryKey: ['diet', playerId, week],
    queryFn: () => listDietDays(playerId!, week),
    enabled: !!playerId,
  });

  const weekDays = dietDays ?? [];
  const byDow = new Map(weekDays.map((d) => [d.day_of_week, d]));

  const [selectedDow, setSelectedDow] = useState<number>(todayDayOfWeek());
  const existing = byDow.get(selectedDow) ?? null;

  // Duplicate the full week into the next selected weeks.
  const [dupN, setDupN] = useState(1);
  const dupWeek = useMutation({
    mutationFn: () => {
      const targets = Array.from({ length: dupN }, (_, i) => week + 1 + i);
      return duplicateDietWeek(playerId!, coachId, week, targets);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet', playerId] }),
  });

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <BackButton />
          <h1 style={{ margin: '0.2rem 0 0' }}>
            Diet — {player?.profile?.name ?? player?.profile?.email ?? '…'}
          </h1>
        </div>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ margin: 0, minWidth: 120 }}>
            <label>Week</label>
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))}>
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
          <button type="button" disabled={selectedWeek === week || dietLoading} onClick={() => setWeek(selectedWeek)}>Apply</button>
        </div>
      </div>

      {dietLoading && <LoadingSkeleton rows={6} />}

      {weekDays.length > 0 && week < totalWeeks && (
        <div className="card row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Copy Week {week}'s diet to the next N weeks (overwrites target weeks):
          </span>
          <div className="row" style={{ gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={dupN}
              onChange={(e) => setDupN(Number(e.target.value))}
              style={{ width: 'auto' }}
              disabled={dupWeek.isPending}
            >
              {Array.from({ length: totalWeeks - week }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} week{n === 1 ? '' : 's'}</option>
              ))}
            </select>
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              → W{week + 1}{dupN > 1 ? `–W${week + dupN}` : ''}
            </span>
            <button
              onClick={() => {
                if (confirm(`Copy Week ${week}'s diet to the next ${dupN} week${dupN === 1 ? '' : 's'}?`)) {
                  dupWeek.mutate();
                }
              }}
              disabled={dupWeek.isPending}
            >
              {dupWeek.isPending ? 'Copying…' : 'Duplicate week'}
            </button>
          </div>
          {dupWeek.isSuccess && (
            <span className="badge active">Copied to {dupWeek.data} week{dupWeek.data === 1 ? '' : 's'} ✓</span>
          )}
          {dupWeek.error && <span className="error">{(dupWeek.error as Error).message}</span>}
        </div>
      )}

      {!dietLoading && <>
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

      <DietDayCard
        key={`${week}-${selectedDow}`}
        playerId={playerId!}
        coachId={coachId}
        week={week}
        dayOfWeek={selectedDow}
        dayName={DAY_NAMES[selectedDow]}
        existing={existing}
        totalWeeks={totalWeeks}
      />
      </>}
    </div>
  );
}
