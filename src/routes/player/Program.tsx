import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import {
  DAY_NAMES,
  DAY_SHORT,
  WEEK_ORDER_SAT_FIRST,
  todayDayOfWeek,
  currentProgramWeek,
  closestProgramWeek,
} from '../../lib/dates';
import { listProgramDays } from '../../api/programs';
import { getActivePlayerLink } from '../../api/players';
import { listMessagesForPlayer } from '../../api/messages';
import DayPanel from './program/DayPanel';

export default function PlayerProgram() {
  const { session, profile } = useAuth();
  const playerId = session!.user.id;
  const [week, setWeek] = useState(1);

  const { data: days, isLoading } = useQuery({
    queryKey: ['program', playerId],
    queryFn: () => listProgramDays(playerId),
  });
  const { data: activeLink } = useQuery({
    queryKey: ['active-player-link', playerId],
    queryFn: () => getActivePlayerLink(playerId),
  });

  const weekInitialized = useRef(false);
  const weeks = Array.from(new Set((days ?? []).map((d) => d.week_number))).sort((a, b) => a - b);
  const automaticWeek = activeLink && weeks.length > 0
    ? closestProgramWeek(weeks, currentProgramWeek(activeLink.created_at, Math.max(...weeks)))
    : week;
  const visibleWeek = weekInitialized.current ? week : automaticWeek;
  useEffect(() => {
    if (weekInitialized.current || !activeLink || weeks.length === 0) return;
    const current = currentProgramWeek(activeLink.created_at, Math.max(...weeks));
    setWeek(closestProgramWeek(weeks, current));
    weekInitialized.current = true;
  }, [activeLink, weeks]);
  const weekDays = (days ?? [])
    .filter((d) => d.week_number === visibleWeek)
    .sort((a, b) => a.day_of_week - b.day_of_week);
  const byDow = new Map(weekDays.map((d) => [d.day_of_week, d]));

  const [selectedDow, setSelectedDow] = useState<number>(todayDayOfWeek());
  const selectedDay = byDow.get(selectedDow) ?? null;

  const { data: generalMessages } = useQuery({
    queryKey: ['playerMessages', playerId],
    queryFn: () => listMessagesForPlayer(playerId),
  });
  const general = (generalMessages ?? []).filter((m) => m.exercise_id === null);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Week {visibleWeek}: Training program for {profile?.name ?? 'you'}</h1>
        {weeks.length > 0 && (
          <div className="field" style={{ margin: 0, minWidth: 120 }}>
            <label>Week</label>
            <select value={visibleWeek} onChange={(e) => { weekInitialized.current = true; setWeek(Number(e.target.value)); }}>
              {weeks.map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading && <LoadingSkeleton rows={6} />}

      {general.length > 0 && (
        <div className="card stack" style={{ gap: '0.4rem' }}>
          <strong>Messages from your coach</strong>
          {general.map((m) => (
            <div key={m.id}>
              💬 {m.body}
              <span className="muted" style={{ fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                {new Date(m.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {!isLoading && weekDays.length === 0 && (
        <div className="card">
          <p className="muted">No program set for this week yet. Check back soon.</p>
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
            <DayPanel key={selectedDay.id} day={selectedDay} playerId={playerId} />
          ) : (
            <div className="card">
              <p className="muted">
                Nothing scheduled for {DAY_NAMES[selectedDow]}.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** The active day's panel. Contents always shown; workouts inside are collapsible. */
