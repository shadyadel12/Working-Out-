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
import { assignProgramTemplateToPlayer, listProgramTemplates } from '../../api/programTemplates';

export default function ProgramBuilder() {
  const { playerId } = useParams<{ playerId: string }>();
  const { session } = useAuth();
  const coachId = session!.user.id;
  const [week, setWeek] = useState(1);
  const [assignOpen, setAssignOpen] = useState(false);
  const [templateId, setTemplateId] = useState('');

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
  const { data: templates = [] } = useQuery({ queryKey: ['program-templates', coachId], queryFn: () => listProgramTemplates(coachId) });
  const selectedTemplate = templates.find((template) => template.id === templateId);
  const assign = useMutation({
    mutationFn: () => assignProgramTemplateToPlayer(playerId!, templateId, week),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['program', playerId] }); setAssignOpen(false); setTemplateId(''); },
  });

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

      <div className="program-top-actions">
        <div><strong>Saved Program</strong><span>Apply a complete saved program starting from Week {week}.</span></div>
        <button type="button" onClick={() => setAssignOpen(true)}>+ Assign Program</button>
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
      {assignOpen && <div className="workout-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !assign.isPending && setAssignOpen(false)}><section className="workout-modal assign-program-modal" role="dialog" aria-modal="true"><header><h2>Assign Program</h2><button className="modal-close" onClick={() => setAssignOpen(false)}>×</button></header><div className="workout-modal-body"><div className="field"><label>Choose saved program</label><select value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Select a program…</option>{templates.map((template) => <option value={template.id} key={template.id}>{template.name} — {template.duration_weeks} week{template.duration_weeks === 1 ? '' : 's'}</option>)}</select></div><div className="field"><label>Starting week</label><select value={week} onChange={(event) => setWeek(Number(event.target.value))}>{Array.from({ length: totalWeeks }, (_, index) => index + 1).map((number) => <option key={number} value={number}>Week {number}</option>)}</select></div>{selectedTemplate && <div className="assign-program-summary"><strong>{selectedTemplate.name}</strong><span>{selectedTemplate.difficulty} · {selectedTemplate.duration_weeks} week{selectedTemplate.duration_weeks === 1 ? '' : 's'}</span><p>This replaces the player’s existing schedule from Week {week} through Week {week + selectedTemplate.duration_weeks - 1}.</p>{week + selectedTemplate.duration_weeks - 1 > totalWeeks && <p className="error">This program extends beyond the player’s available subscription weeks.</p>}</div>}{assign.error && <p className="error">{(assign.error as Error).message}</p>}</div><footer><button className="secondary" onClick={() => setAssignOpen(false)}>Cancel</button><button disabled={!selectedTemplate || assign.isPending || week + (selectedTemplate?.duration_weeks ?? 1) - 1 > totalWeeks} onClick={() => { if (confirm('Replace the existing schedule in these weeks with this saved program?')) assign.mutate(); }}>{assign.isPending ? 'Assigning…' : 'Assign Program'}</button></footer></section></div>}
    </div>
  );
}
