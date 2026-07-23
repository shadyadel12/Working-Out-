import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  saveIngredient,
  saveIngredients,
  type Ingredient,
  type IngredientInput,
} from '../../../api/ingredients';

const blankIngredient = (): IngredientInput => ({
  name: '',
  category: '',
  defaultUnit: 'g',
  imageUrl: '',
});

interface IngredientEditorProps {
  coachId: string;
  mode: Ingredient | 'single' | 'multiple';
  onClose: () => void;
  onSaved: () => void;
}

export default function IngredientEditor({ coachId, mode, onClose, onSaved }: IngredientEditorProps) {
  const multiple = mode === 'multiple';
  const existing = typeof mode === 'object' ? mode : null;
  const [items, setItems] = useState<IngredientInput[]>(existing ? [{
    name: existing.name,
    category: existing.category ?? '',
    defaultUnit: existing.default_unit,
    imageUrl: existing.image_url ?? '',
  }] : [blankIngredient()]);

  const save = useMutation({
    mutationFn: async () => {
      if (multiple) await saveIngredients(coachId, items);
      else await saveIngredient(coachId, existing?.id ?? null, items[0]);
    },
    onSuccess: onSaved,
  });
  const patch = (index: number, change: Partial<IngredientInput>) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...change } : item));
  };

  return <div className="catalog-dialog-backdrop">
    <section className="catalog-dialog ingredient-dialog">
      <header>
        <div><span className="overview-kicker">{existing ? 'Edit' : 'Create'}</span><h2>{multiple ? 'Multiple ingredients' : 'Ingredient'}</h2></div>
        <button className="secondary catalog-close" onClick={onClose}>×</button>
      </header>
      <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
        {items.map((item, index) => <div className="ingredient-form-row" key={index}>
          <label>Name<input required value={item.name} onChange={(event) => patch(index, { name: event.target.value })} placeholder="Chicken breast" /></label>
          <label>Category<input value={item.category} onChange={(event) => patch(index, { category: event.target.value })} placeholder="Protein" /></label>
          <label>Default unit<input required value={item.defaultUnit} onChange={(event) => patch(index, { defaultUnit: event.target.value })} placeholder="g, item, cup" /></label>
          <label>Image URL<input type="url" value={item.imageUrl} onChange={(event) => patch(index, { imageUrl: event.target.value })} placeholder="https://…" /></label>
          {multiple && items.length > 1 && <button type="button" className="danger" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>}
        </div>)}
        {multiple && <button type="button" className="secondary" onClick={() => setItems((current) => [...current, blankIngredient()])}>+ Add another ingredient</button>}
        {save.error && <p className="error">{(save.error as Error).message}</p>}
        <footer>
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button disabled={items.some((item) => !item.name.trim() || !item.defaultUnit.trim()) || save.isPending}>{save.isPending ? 'Saving…' : 'Save ingredients'}</button>
        </footer>
      </form>
    </section>
  </div>;
}
