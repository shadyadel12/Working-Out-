/** Edits, duplicates, saves, and reuses one player's diet day. */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertDietDay, deleteDietDay, duplicateDietDayToWeeks, listCoachFoods, addCoachFood } from '../../../api/diet';
import { assignDietTemplate, listDietTemplates, saveDietAsTemplate } from '../../../api/dietTemplates';
import type { DietDay, DietFoodItem, DietMeal } from '../../../types/database.types';
import WeekPicker from '../../../components/WeekPicker';
import FoodPicker from '../../../components/FoodPicker';
import { buildSlots } from './buildSlots';

export default function DietDayCard({
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

