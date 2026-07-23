import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteDietTemplate, duplicateDietTemplate, listDietTemplates, saveDietTemplate, type DietTemplate } from '../../../api/dietTemplates';
import LoadingSkeleton from '../../../components/LoadingSkeleton';
import SavedMealDayEditor from './SavedMealDayEditor';

export default function SavedMealDays({ coachId }: { coachId: string }) {
  const client = useQueryClient();
  const [editor, setEditor] = useState<DietTemplate | 'new' | null>(null);
  const query = useQuery({ queryKey: ['diet-templates', coachId], queryFn: () => listDietTemplates(coachId) });
  const refresh = () => client.invalidateQueries({ queryKey: ['diet-templates', coachId] });
  const remove = useMutation({ mutationFn: deleteDietTemplate, onSuccess: refresh });
  const duplicate = useMutation({ mutationFn: duplicateDietTemplate, onSuccess: refresh });
  const save = useMutation({ mutationFn: (value: { name: string; meals: DietTemplate['meals']; comment: string }) => saveDietTemplate({ id: editor !== 'new' ? editor?.id : undefined, coachId, ...value }), onSuccess: async () => { await refresh(); setEditor(null); } });
  if (query.isLoading) return <LoadingSkeleton rows={5} />;
  const plans = query.data ?? [];
  return <section className="saved-meal-days">
    <div className="food-library-help saved-days-heading"><div><strong>Reusable full-day meal schedules</strong><p>Create a complete day here, then add all its meals to any player day.</p></div><button onClick={() => setEditor('new')}>+ Create Saved Meal Day</button></div>
    {plans.length > 0 ? <div className="food-library-grid">{plans.map((plan) => { const foodCount = plan.meals.reduce((total, meal) => total + (meal.items?.length ?? 0), 0); return <article key={plan.id}><span>{plan.meals.length}</span><div><strong>{plan.name}</strong><small>{plan.meals.length} meal slot{plan.meals.length === 1 ? '' : 's'} · {foodCount} food item{foodCount === 1 ? '' : 's'}</small></div><div className="saved-day-actions"><button className="secondary" onClick={() => setEditor(plan)}>Edit</button><button className="secondary" disabled={duplicate.isPending} onClick={() => duplicate.mutate(plan)}>Duplicate</button><button className="danger" disabled={remove.isPending} onClick={() => confirm(`Remove ${plan.name}? Templates currently assigned to players must be replaced first.`) && remove.mutate(plan.id)}>Remove</button></div></article>; })}</div> : <div className="catalog-empty"><h2>No saved meal days yet</h2><p>Create a reusable full day without needing to open a player first.</p><button onClick={() => setEditor('new')}>+ Create Saved Meal Day</button></div>}
    {(remove.error || duplicate.error) && <p className="error">{((remove.error || duplicate.error) as Error).message}</p>}
    {editor && <SavedMealDayEditor coachId={coachId} initial={editor === 'new' ? undefined : editor} saving={save.isPending} onClose={() => setEditor(null)} onSave={(value) => save.mutate(value)} />}
  </section>;
}
