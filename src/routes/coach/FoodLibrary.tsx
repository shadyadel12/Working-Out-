import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { addCoachFood, listCoachFoods, removeCoachFood } from '../../api/diet';
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function FoodLibrary() {
  const { effectiveCoachId } = useAuth(); const coachId = effectiveCoachId!; const client = useQueryClient();
  const [search, setSearch] = useState(''); const [newFood, setNewFood] = useState(''); const [adding, setAdding] = useState(false);
  const query = useQuery({ queryKey: ['coachFoods', coachId], queryFn: () => listCoachFoods(coachId) });
  const refresh = () => client.invalidateQueries({ queryKey: ['coachFoods', coachId] });
  const add = useMutation({ mutationFn: () => addCoachFood(coachId, newFood), onSuccess: async () => { setNewFood(''); setAdding(false); await refresh(); } });
  const remove = useMutation({ mutationFn: removeCoachFood, onSuccess: refresh });
  const foods = useMemo(() => (query.data ?? []).filter((food) => food.name.toLowerCase().includes(search.toLowerCase())), [query.data, search]);
  return <div className="food-library-page">
    <header className="catalog-heading"><div><span className="overview-kicker">Nutrition Library</span><h1>Foods</h1><p>Save frequently used foods once, then quickly add them to meals in a player’s Diet page.</p></div><button onClick={() => setAdding(true)}>+ Add food</button></header>
    <section className="food-library-help"><strong>The easiest way to add meals</strong><p>Add your common foods here first. Later, open a player’s Diet, select a meal, and press the <b>+</b> button beside any saved food.</p></section>
    {adding && <form className="food-quick-add" onSubmit={(event) => { event.preventDefault(); add.mutate(); }}><label>Food name<input autoFocus value={newFood} maxLength={200} onChange={(event) => setNewFood(event.target.value)} placeholder="Example: Chicken breast" /></label><button disabled={!newFood.trim() || add.isPending}>{add.isPending ? 'Adding…' : '+ Add food'}</button><button type="button" className="secondary" onClick={() => { setAdding(false); setNewFood(''); }}>Cancel</button>{add.error && <p className="error">{(add.error as Error).message}</p>}</form>}
    <div className="catalog-toolbar"><label className="catalog-search"><span className="sr-only">Search foods</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search saved foods" /></label><span className="muted">{foods.length} saved food{foods.length === 1 ? '' : 's'}</span></div>
    {query.isLoading ? <LoadingSkeleton rows={6} /> : <div className="food-library-grid">{foods.map((food) => <article key={food.id}><span>{food.name.slice(0, 2).toUpperCase()}</span><div><strong>{food.name}</strong><small><b>+</b> Ready to add to future meals</small></div><button type="button" className="danger" onClick={() => confirm(`Remove ${food.name} from reusable foods? Existing meals will not change.`) && remove.mutate(food.id)}>Remove</button></article>)}</div>}
    {query.isSuccess && foods.length === 0 && <div className="catalog-empty"><h2>No foods found</h2><p>Add a reusable food now, then use it later while building player meals.</p><button onClick={() => setAdding(true)}>+ Add food</button></div>}
  </div>;
}
