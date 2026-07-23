import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteDietTemplate, listDietTemplates } from '../../../api/dietTemplates';
import LoadingSkeleton from '../../../components/LoadingSkeleton';

export default function SavedMealDays({ coachId }: { coachId: string }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['diet-templates', coachId], queryFn: () => listDietTemplates(coachId) });
  const remove = useMutation({ mutationFn: deleteDietTemplate, onSuccess: () => client.invalidateQueries({ queryKey: ['diet-templates', coachId] }) });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  const plans = query.data ?? [];
  return <section className="saved-meal-days">
    <div className="food-library-help"><strong>Reusable full-day meal schedules</strong><p>These are complete days saved from a player's Diet page. Choose one there to add all its meals to another player or day.</p></div>
    {plans.length > 0 ? <div className="food-library-grid">{plans.map((plan) => { const foodCount = plan.meals.reduce((total, meal) => total + (meal.items?.length ?? 0), 0); return <article key={plan.id}><span>{plan.meals.length}</span><div><strong>{plan.name}</strong><small>{plan.meals.length} meal slot{plan.meals.length === 1 ? '' : 's'} · {foodCount} food item{foodCount === 1 ? '' : 's'}</small></div><button type="button" className="danger" disabled={remove.isPending} onClick={() => confirm(`Remove ${plan.name}? Player days already using it may be affected.`) && remove.mutate(plan.id)}>Remove</button></article>; })}</div> : <div className="catalog-empty"><h2>No saved meal days yet</h2><p>Open a player's Diet, build and save a day, then choose “Save to Saved Meal Days.”</p></div>}
    {remove.error && <p className="error">{(remove.error as Error).message}</p>}
  </section>;
}
