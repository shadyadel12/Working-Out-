import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { DAY_NAMES, DAY_SHORT, WEEK_ORDER_SAT_FIRST, todayDayOfWeek } from '../../lib/dates';
import { getPlayerForCoach } from '../../api/players';
import {
  listDietDays,
  upsertDietDay,
  deleteDietDay,
  duplicateDietDayToWeeks,
  duplicateDietWeek,
  listCoachFoods,
  addCoachFood,
} from '../../api/diet';
import type { DietDay, DietFoodItem, DietMeal } from '../../types/database.types';
import WeekPicker from '../../components/WeekPicker';
import FoodPicker from '../../components/FoodPicker';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { assignDietTemplate, listDietTemplates, saveDietAsTemplate } from '../../api/dietTemplates';

/** Build meal slots from counts: snacks are spread evenly between meals. */
function buildSlots(meals: number, snacks: number): DietMeal[] {
  const slots: DietMeal[] = [];
  // Interleave: after each meal, possibly a snack, distributed evenly.
  let snackIdx = 0;
  for (let m = 1; m <= meals; m++) {
    slots.push({ type: 'meal', label: `Meal ${m}`, content: '', items: [] });
    // Place snacks after all but the last meal, spread evenly.
    const snacksSoFar = Math.round((m / Math.max(1, meals)) * snacks);
    while (snackIdx < snacksSoFar && snackIdx < snacks && m < meals) {
      snackIdx++;
      slots.push({ type: 'snack', label: `Snack ${snackIdx}`, content: '', items: [] });
    }
  }
  // Any remaining snacks go at the end.
  while (snackIdx < snacks) {
    snackIdx++;
    slots.push({ type: 'snack', label: `Snack ${snackIdx}`, content: '', items: [] });
  }
  return slots;
}

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

  const { data: dietDays, isLoading: dietLoading } = useQuery({
    queryKey: ['diet', playerId, week],
    queryFn: () => listDietDays(playerId!, week),
    enabled: !!playerId,
  });

  const weekDays = dietDays ?? [];
  const byDow = new Map(weekDays.map((d) => [d.day_of_week, d]));

  const [selectedDow, setSelectedDow] = useState<number>(todayDayOfWeek());
  const existing = byDow.get(selectedDow) ?? null;

  // Duplicate full week → next N weeks
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
          <Link to="/coach/dashboard" className="muted" style={{ fontSize: '0.85rem' }}>
            ← Dashboard
          </Link>
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

function DietDayCard({
  playerId, coachId, week, dayOfWeek, dayName, existing, totalWeeks,
}: {
  playerId: string;
  coachId: string;
  week: number;
  dayOfWeek: number;
  dayName: string;
  existing: DietDay | null;
  totalWeeks: number;
}) {
  const qc = useQueryClient();
  const [meals, setMeals] = useState<DietMeal[]>(existing?.meals ?? []);
  const [comment, setComment] = useState<string>(existing?.comment ?? '');
  const [mealCount, setMealCount] = useState(
    existing ? existing.meals.filter((m) => m.type === 'meal').length || 3 : 3
  );
  const [snackCount, setSnackCount] = useState(
    existing ? existing.meals.filter((m) => m.type === 'snack').length : 1
  );
  const [templateId, setTemplateId] = useState('');
  const [templateName, setTemplateName] = useState(`${dayName} diet`);
  const { data: templates = [] } = useQuery({ queryKey: ['diet-templates', coachId], queryFn: () => listDietTemplates(coachId) });
  const useTemplate = useMutation({
    mutationFn: () => assignDietTemplate(playerId, week, dayOfWeek, templateId),
    onSuccess: () => {
      const template = templates.find((item) => item.id === templateId);
      if (template) { setMeals(template.meals); setComment(template.comment ?? ''); }
      setTemplateId('');
      qc.invalidateQueries({ queryKey: ['diet', playerId] });
    },
  });
  const saveTemplate = useMutation({
    mutationFn: () => saveDietAsTemplate(existing!.id, templateName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet-templates', coachId] }),
  });

  function generate() {
    if (meals.length > 0 && !confirm('Regenerate meal slots? Existing text for this day will be cleared.')) return;
    setMeals(buildSlots(mealCount, snackCount));
  }

  // Coach's food library for the dropdowns.
  const { data: foods } = useQuery({
    queryKey: ['coachFoods', coachId],
    queryFn: () => listCoachFoods(coachId),
  });
  const foodNames = (foods ?? []).map((f) => f.name);

  const setItem = (mi: number, ii: number, patch: Partial<DietFoodItem>) =>
    setMeals((ms) =>
      ms.map((m, idx) =>
        idx === mi
          ? { ...m, items: (m.items ?? []).map((it, j) => (j === ii ? { ...it, ...patch } : it)) }
          : m
      )
    );
  const addItem = (mi: number) =>
    setMeals((ms) =>
      ms.map((m, idx) =>
        idx === mi ? { ...m, items: [...(m.items ?? []), { food: '', grams: '' }] } : m
      )
    );
  const removeItem = (mi: number, ii: number) =>
    setMeals((ms) =>
      ms.map((m, idx) =>
        idx === mi ? { ...m, items: (m.items ?? []).filter((_, j) => j !== ii) } : m
      )
    );

  const save = useMutation({
    mutationFn: async () => {
      // Save any new food names to the coach's library first.
      const known = new Set(foodNames.map((n) => n.toLowerCase()));
      const newFoods = new Set<string>();
      for (const m of meals) {
        for (const it of m.items ?? []) {
          const name = it.food.trim();
          if (name && !known.has(name.toLowerCase())) newFoods.add(name);
        }
      }
      for (const name of newFoods) await addCoachFood(coachId, name);

      return upsertDietDay({
        player_id: playerId,
        coach_id: coachId,
        week_number: week,
        day_of_week: dayOfWeek,
        meals,
        comment: comment.trim() || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet', playerId] });
      qc.invalidateQueries({ queryKey: ['coachFoods', coachId] });
    },
  });

  const del = useMutation({
    mutationFn: () => deleteDietDay(existing!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet', playerId] }),
  });

  const [dupOpen, setDupOpen] = useState(false);
  const dupDay = useMutation({
    mutationFn: (targetWeeks: number[]) =>
      duplicateDietDayToWeeks(playerId, coachId, week, dayOfWeek, targetWeeks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet', playerId] });
      setDupOpen(false);
    },
  });

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <strong>{dayName}</strong>{' '}
          <span className="muted">— {existing ? `${existing.meals.length} items` : 'not set'}</span>
        </div>
        {existing && (
          <button type="button" className="secondary" onClick={() => setDupOpen((o) => !o)}>
            {dupOpen ? 'Cancel' : 'Duplicate day…'}
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
          label={`Copy ${dayName} diet of Week ${week} to`}
        />
      )}
      {dupDay.error && <span className="error">{(dupDay.error as Error).message}</span>}
      {dupDay.isSuccess && (
        <span className="badge active">Duplicated to {dupDay.data} week{dupDay.data === 1 ? '' : 's'} ✓</span>
      )}

      <div className="card stack" style={{ background: 'var(--surface-2)' }}>
        <strong>Saved diet library</strong>
        {templates.length > 0 && <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0, flex: 1, minWidth: 180 }}><label>Use saved diet</label><select value={templateId} onChange={(event) => setTemplateId(event.target.value)}><option value="">Select from library…</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></div>
          <button type="button" disabled={!templateId || useTemplate.isPending} onClick={() => useTemplate.mutate()}>{useTemplate.isPending ? 'Adding…' : 'Add to this player/day'}</button>
        </div>}
        {existing && <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0, flex: 1, minWidth: 180 }}><label>Library name</label><input value={templateName} maxLength={200} onChange={(event) => setTemplateName(event.target.value)} /></div>
          <button type="button" className="secondary" disabled={!templateName.trim() || saveTemplate.isPending} onClick={() => saveTemplate.mutate()}>{saveTemplate.isPending ? 'Saving…' : 'Save diet once for reuse'}</button>
        </div>}
        {saveTemplate.isSuccess && <span className="badge active">Saved once for reuse ✓</span>}
        {(saveTemplate.error || useTemplate.error) && <span className="error">{((saveTemplate.error || useTemplate.error) as Error).message}</span>}
      </div>

      <div className="stack" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.9rem' }}>
        <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0, flex: 1, minWidth: 110 }}>
            <label>Meals</label>
            <input
              type="number"
              min={0}
              max={10}
              value={mealCount}
              onChange={(e) => setMealCount(Math.max(0, Math.min(10, Number(e.target.value))))}
            />
          </div>
          <div className="field" style={{ margin: 0, flex: 1, minWidth: 110 }}>
            <label>Snacks</label>
            <input
              type="number"
              min={0}
              max={10}
              value={snackCount}
              onChange={(e) => setSnackCount(Math.max(0, Math.min(10, Number(e.target.value))))}
            />
          </div>
          <button type="button" className="secondary" onClick={generate}>
            Generate slots
          </button>
        </div>

        {meals.length === 0 && (
          <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
            Choose how many meals and snacks, then press "Generate slots".
          </p>
        )}

        {meals.map((m, mi) => (
          <div
            key={mi}
            className="card stack"
            style={{
              background: 'var(--surface-2)',
              gap: '0.5rem',
              borderLeft: m.type === 'snack' ? '3px solid var(--warning, #fbbf24)' : '3px solid var(--accent)',
            }}
          >
            <strong style={{ fontSize: '0.9rem' }}>{m.label}</strong>

            {(m.items ?? []).map((it, ii) => (
              <div key={ii} className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="field" style={{ margin: 0, flex: 2, minWidth: 160 }}>
                  <label>Food type</label>
                  <FoodPicker
                    value={it.food}
                    onChange={(v) => setItem(mi, ii, { food: v })}
                    options={foodNames}
                  />
                </div>
                <div className="field" style={{ margin: 0, flex: 1, minWidth: 90 }}>
                  <label>Grams</label>
                  <input
                    type="number"
                    min={0}
                    value={it.grams}
                    onChange={(e) => setItem(mi, ii, { grams: e.target.value })}
                    placeholder="150"
                  />
                </div>
                <button
                  className="danger"
                  type="button"
                  onClick={() => removeItem(mi, ii)}
                  style={{ padding: '0.55em 0.8em' }}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="secondary"
              type="button"
              onClick={() => addItem(mi)}
              style={{ alignSelf: 'flex-start' }}
            >
              + Add food
            </button>
          </div>
        ))}

        <div className="field" style={{ margin: 0 }}>
          <label>Coach note for this day</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional note to the player about this day's diet…"
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button onClick={() => save.mutate()} disabled={save.isPending || meals.length === 0}>
            {save.isPending ? 'Saving…' : existing ? 'Save day' : 'Create day'}
          </button>
          {existing && (
            <button
              className="danger"
              onClick={() => { if (confirm('Delete this diet day?')) del.mutate(); }}
              disabled={del.isPending}
            >
              Delete day
            </button>
          )}
          {save.isSuccess && <span className="badge active">Saved ✓</span>}
          {save.error && <span className="error">{(save.error as Error).message}</span>}
          {del.error && <span className="error">{(del.error as Error).message}</span>}
        </div>
      </div>
    </div>
  );
}
