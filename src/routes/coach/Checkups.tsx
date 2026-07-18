import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { listPlayersForCoach } from '../../api/players';
import { listCheckupsForDate, setCheckup } from '../../api/checkups';
import { todayISO } from '../../lib/dates';
import BackButton from '../../components/BackButton';

export default function Checkups() {
  const { session } = useAuth();
  const coachId = session!.user.id;
  const qc = useQueryClient();
  const [date, setDate] = useState(todayISO());

  const { data: players } = useQuery({
    queryKey: ['players', coachId],
    queryFn: () => listPlayersForCoach(coachId),
  });

  const { data: checkups } = useQuery({
    queryKey: ['checkups', coachId, date],
    queryFn: () => listCheckupsForDate(coachId, date),
  });

  const checkedMap = new Map((checkups ?? []).map((c) => [c.player_id, c.is_checked]));

  const toggle = useMutation({
    mutationFn: ({ playerId, checked }: { playerId: string; checked: boolean }) =>
      setCheckup(coachId, playerId, date, checked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkups', coachId, date] }),
  });

  // Only claimed players can be checked (they have a profile + id).
  const selectedWeekday = new Date(`${date}T12:00:00`).getDay();
  const claimed = (players ?? []).filter((p) => p.profile !== null && (p.link.is_vip || p.link.checkup_weekdays.includes(selectedWeekday))).sort((a, b) => Number(b.link.is_vip) - Number(a.link.is_vip));

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <BackButton />
          <h1 style={{ margin: '0.2rem 0 0' }}>Daily check-ups</h1>
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {claimed.length === 0 && <p className="muted">No players to check in on.</p>}

      <div className="stack">
        {claimed.map((p) => {
          const checked = checkedMap.get(p.profile!.id) ?? false;
          return (
            <div key={p.profile!.id} className="card row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{p.profile!.name ?? p.profile!.email} {p.link.is_vip && <span className="badge vip">VIP</span>}</strong>
                <div className="muted" style={{ fontSize: '0.8rem' }}>{p.profile!.email}</div>
              </div>
              <label className="row" style={{ gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={checked}
                  onChange={(e) => toggle.mutate({ playerId: p.profile!.id, checked: e.target.checked })}
                />
                {checked ? 'Checked' : 'Mark checked'}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
