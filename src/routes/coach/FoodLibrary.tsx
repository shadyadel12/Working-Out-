import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { addCoachFood, listCoachFoods, removeCoachFood } from '../../api/diet';
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function FoodLibrary() {
  const { effectiveCoachId } = useAuth();
  const coachId = effectiveCoachId!;
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [newFood, setNewFood] = useState('');
  const [measure, setMeasure] = useState<'grams' | 'quantity'>('grams');
  const [amount, setAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const query = useQuery({ queryKey: ['coachFoods', coachId], queryFn: () => listCoachFoods(coachId) });
  const refresh = () => client.invalidateQueries({ queryKey: ['coachFoods', coachId] });
  const resetForm = () => { setNewFood(''); setMeasure('grams'); setAmount(''); };
  const add = useMutation({
    mutationFn: () => addCoachFood(coachId, newFood, measure, amount),
    onSuccess: async () => { resetForm(); setAdding(false); await refresh(); },
  });
  const remove = useMutation({ mutationFn: removeCoachFood, onSuccess: refresh });
  const foods = useMemo(() => (query.data ?? []).filter((food) => food.name.toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  return <div className="food-library-page">
    <header className="catalog-heading"><div><span className="overview-kicker">Nutrition Library</span><h1>Foods</h1><p>Save frequently used foods once, then quickly add them to meals in a player's Diet page.</p></div><button onClick={() => setAdding(true)}>+ Add food</button></header>
    <section className="food-library-help"><strong>The easiest way to add meals</strong><p>Add your common foods here with their usual measurement and amount. Those values are filled automatically when you add the food to a player's meal.</p></section>
    {adding && <form className="food-quick-add" onSubmit={(event) => { event.preventDefault(); add.mutate(); }}>
      <label>Food<input autoFocus value={newFood} maxLength={200} onChange={(event) => setNewFood(event.target.value)} placeholder="Choose or type food" /></label>
      <label>Measure<select value={measure} onChange={(event) => setMeasure(event.target.value as 'grams' | 'quantity')}><option value="grams">Grams</option><option value="quantity">Quantity</option></select></label>
      <label>{measure === 'grams' ? 'Grams' : 'Quantity'}<input type="number" min="0" step={measure === 'grams' ? 'any' : '1'} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={measure === 'grams' ? '150' : '2'} /></label>
      <button disabled={!newFood.trim() || !amount || add.isPending}>{add.isPending ? 'Adding…' : '+ Add food'}</button>
      <button type="button" className="secondary" onClick={() => { setAdding(false); resetForm(); }}>Cancel</button>
      {add.error && <p className="error">{(add.error as Error).message}</p>}
    </form>}
    <div className="catalog-toolbar"><label className="catalog-search"><span className="sr-only">Search foods</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search saved foods" /></label><span className="muted">{foods.length} saved food{foods.length === 1 ? '' : 's'}</span></div>
    {query.isLoading ? <LoadingSkeleton rows={6} /> : <div className="food-library-grid">{foods.map((food) => <article key={food.id}><span>{food.name.slice(0, 2).toUpperCase()}</span><div><strong>{food.name}</strong><small>{food.amount || 'No default amount'}{food.amount ? (food.measure === 'quantity' ? ` ${Number(food.amount) === 1 ? 'item' : 'items'}` : ' g') : ''}</small></div><button type="button" className="danger" onClick={() => confirm(`Remove ${food.name} from reusable foods? Existing meals will not change.`) && remove.mutate(food.id)}>Remove</button></article>)}</div>}
    {query.isSuccess && foods.length === 0 && <div className="catalog-empty"><h2>No foods found</h2><p>Add a reusable food now, then use it later while building player meals.</p><button onClick={() => setAdding(true)}>+ Add food</button></div>}
  </div>;
}
