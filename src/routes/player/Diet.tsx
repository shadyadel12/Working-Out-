import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { DAY_NAMES, DAY_SHORT, WEEK_ORDER_SAT_FIRST, currentProgramWeek, todayDayOfWeek } from '../../lib/dates';
import { getActivePlayerLink } from '../../api/players';
import { listDietDays } from '../../api/diet';
import { saveDietLog } from '../../api/dietProgress';
import type { DietDay } from '../../types/database.types';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ActionButtonContent from '../../components/ActionButtonContent';
import { getActiveMealPlanAssignment } from '../../api/nutritionLibrary';

export default function PlayerDiet() {
  const { session, profile } = useAuth();
  const playerId = session!.user.id;
  const [week, setWeek] = useState(1);

  const { data: dietDays, isLoading } = useQuery({
    queryKey: ['diet', playerId],
    queryFn: () => listDietDays(playerId),
  });
  const { data: activeLink } = useQuery({
    queryKey: ['active-player-link', playerId],
    queryFn: () => getActivePlayerLink(playerId),
  });
  const { data: mealPlan } = useQuery({ queryKey: ['active-meal-plan', playerId], queryFn: () => getActiveMealPlanAssignment(playerId) });

  const weekInitialized = useRef(false);
  const automaticWeek = activeLink ? currentProgramWeek(activeLink.created_at) : week;
  const weeks = Array.from(new Set([...(dietDays ?? []).map((d) => d.week_number), automaticWeek])).sort((a, b) => a - b);
  const visibleWeek = weekInitialized.current ? week : automaticWeek;
  useEffect(() => {
    if (weekInitialized.current || !activeLink) return;
    setWeek(currentProgramWeek(activeLink.created_at));
    weekInitialized.current = true;
  }, [activeLink]);
  const weekDays = (dietDays ?? []).filter((d) => d.week_number === visibleWeek);
  const byDow = new Map(weekDays.map((d) => [d.day_of_week, d]));

  const [selectedDow, setSelectedDow] = useState<number>(todayDayOfWeek());
  const selectedDay = byDow.get(selectedDow) ?? null;

  return (
    <div className="stack">
      {mealPlan && <section className="player-meal-plan-banner">{mealPlan.coverUrl&&<img src={mealPlan.coverUrl} alt=""/>}<div><span className="overview-kicker">Assigned meal plan</span><h2>{mealPlan.title}</h2><p>{mealPlan.description||`Available in Week ${mealPlan.startWeek}${mealPlan.endWeek>mealPlan.startWeek?`–${mealPlan.endWeek}`:''}.`}</p></div></section>}
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Week {visibleWeek}: Diet plan for {profile?.name ?? 'you'}</h1>
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
                <details
                  key={i}
                  className={`card player-meal-dropdown ${m.type === 'snack' ? 'snack' : ''}`}
                  style={{
                    background: 'var(--surface-2)',
                  }}
                >
                  <summary><strong>{m.label}</strong><span aria-hidden="true">⌄</span></summary>
                  <div className="player-meal-dropdown-body">
                    {(m.items ?? []).length > 0 ? (
                      (m.items ?? []).map((it, j) => <div key={j} className="player-meal-item"><span>{it.food}</span><span className="muted">{it.unit === 'quantity' ? (it.quantity ? `${it.quantity} ${it.quantityUnit ?? (Number(it.quantity) === 1 ? 'item' : 'items')}` : '') : (it.grams ? `${it.grams} g` : '')}</span></div>)
                    ) : <div style={{ whiteSpace: 'pre-wrap' }}>{m.content || <span className="muted">—</span>}</div>}
                    {(m.recipes??(m.recipe?[m.recipe]:[])).map((recipe,recipeIndex)=><details className="player-recipe" key={`${recipe.id}-${recipeIndex}`}><summary><span>View recipe</span>: {recipe.title}</summary><div><span className="muted">Makes {recipe.servings} serving{recipe.servings===1?'':'s'}</span>{recipe.dietaryLabels?.length?<div className="player-recipe-labels">{recipe.dietaryLabels.map(label=><span key={label}>{label}</span>)}</div>:null}<h4>Ingredients</h4><ul>{recipe.ingredients.map((ingredient,index)=><li key={`${ingredient.food}-${index}`}><span>{ingredient.food}</span><strong>{ingredient.quantity} {ingredient.unit}</strong></li>)}</ul>{recipe.nutrition&&<div className="player-recipe-nutrition"><span>Protein <b>{recipe.nutrition.protein??'—'}g</b></span><span>Carbs <b>{recipe.nutrition.carbs??'—'}g</b></span><span>Fat <b>{recipe.nutrition.fat??'—'}g</b></span><span>Calories <b>{recipe.nutrition.calories??'—'}</b></span></div>}{recipe.videoUrl&&<a href={recipe.videoUrl} target="_blank" rel="noreferrer">Watch cooking video ↗</a>}<h4>How to make it</h4>{[...(recipe.preparationSteps??[]),...(recipe.cookingSteps??[])].length?<ol className="player-recipe-steps">{[...(recipe.preparationSteps??[]),...(recipe.cookingSteps??[])].map((step,index)=><li key={index}><span>{index+1}</span><div><p>{step.text}</p>{step.imageUrl&&<img src={step.imageUrl} alt=""/>}</div></li>)}</ol>:<p>{recipe.instructions||'No preparation instructions were added.'}</p>}</div></details>)}
                  </div>
                </details>
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
  return <div className="card stack diet-checkin-card">
    <strong>Today’s diet check-in</strong>
    <span className="muted" style={{ fontSize: '0.85rem' }}>Tick each meal you followed, then save.</span>
    <div className="diet-checkin-meals">
      {day.meals.map((meal, index) => <label key={index} className="diet-checkin-meal"><input type="checkbox" checked={done[index]} onChange={(e) => setDone((current) => current.map((value, i) => i === index ? e.target.checked : value))} /><span>{meal.label}</span></label>)}
    </div>
    <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={5000} placeholder="Optional note for your coach" rows={2} />
    <button type="button" onClick={() => save.mutate()} disabled={save.isPending}><ActionButtonContent action="save diet progress">{save.isPending ? 'Saving…' : 'Save today’s progress'}</ActionButtonContent></button>
    {save.isSuccess && <span style={{ color: 'var(--success)' }}>Diet progress saved.</span>}
    {save.error && <span className="error">{(save.error as Error).message}</span>}
  </div>;
}
