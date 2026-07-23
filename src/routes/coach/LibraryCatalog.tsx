import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import AppIcon from '../../components/AppIcon';
import ActionButtonContent from '../../components/ActionButtonContent';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { addLibraryRelation, archiveCoachLibraryItem, createMeasurementForGroup, duplicateCoachLibraryItem, listCoachLibraryItems, listLibraryRelations, publishCoachLibraryItem, removeLibraryRelation, saveCoachLibraryItem, type CatalogLifecycle, type CatalogShareMode, type CoachLibraryItem, type LibraryKind } from '../../api/coachLibrary';
import IngredientEditor from './ingredients/IngredientEditor';
import IngredientUnitSelect from './ingredients/IngredientUnitSelect';

const configs: Record<LibraryKind, { title: string; singular: string; description: string; subtypeLabel?: string; subtypeOptions?: string[]; numberLabel?: string; unit?: boolean }> = {
  sections: { title: 'Workout Sections', singular: 'section', description: 'Reusable exercise groups with format-specific timing and prescriptions.', subtypeLabel: 'Format', subtypeOptions: ['standard','interval','amrap','timed','freestyle'], numberLabel: 'Rounds' },
  tasks: { title: 'Tasks', singular: 'task', description: 'Reusable coaching actions for accountability, photos, metrics, and forms.', subtypeLabel: 'Task type', subtypeOptions: ['general','progress_photo','body_metrics','form'] },
  forms: { title: 'Forms & Questionnaires', singular: 'form', description: 'Reusable questionnaires that can be scheduled and answered by players.' },
  'meal-plans': { title: 'Meal Plan Templates', singular: 'meal plan', description: 'Week-based nutrition schedules built from reusable recipes.', numberLabel: 'Number of weeks' },
  ingredients: { title: 'Ingredients', singular: 'ingredient', description: 'A normalized food catalog used to calculate recipe nutrition.', subtypeLabel: 'Category', unit: true },
  recipes: { title: 'Recipes', singular: 'recipe', description: 'Reusable dishes with ingredients, servings, instructions, and nutrition.', subtypeLabel: 'Category', numberLabel: 'Servings' },
  'recipe-books': { title: 'Recipe Books', singular: 'recipe book', description: 'Curated recipe collections ready to share with players.' },
  'metric-groups': { title: 'Metric Groups', singular: 'metric group', description: 'Reusable measurement collections for check-ins and progress tracking.' },
};

export default function LibraryCatalog({ kind }: { kind: LibraryKind }) {
  const { session } = useAuth(); const coachId = session!.user.id; const qc = useQueryClient(); const config = configs[kind];
  const [search, setSearch] = useState(''); const [status, setStatus] = useState<'active' | CatalogLifecycle>('active'); const [editor, setEditor] = useState<CoachLibraryItem | 'new' | null>(null);
  const query = useQuery({ queryKey: ['coach-library', kind, coachId], queryFn: () => listCoachLibraryItems(kind, coachId, true) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['coach-library', kind, coachId] });
  const archive = useMutation({ mutationFn: (id: string) => archiveCoachLibraryItem(kind, id), onSuccess: refresh });
  const publish = useMutation({ mutationFn: (id: string) => publishCoachLibraryItem(kind, id), onSuccess: refresh });
  const duplicate = useMutation({ mutationFn: (item: CoachLibraryItem) => duplicateCoachLibraryItem(kind, coachId, item), onSuccess: refresh });
  const rows = useMemo(() => (query.data ?? []).filter((item) => {
    const matchesSearch = `${item.title} ${item.summary ?? ''}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesStatus = status === 'active' ? item.lifecycle !== 'archived' : item.lifecycle === status;
    return matchesSearch && matchesStatus;
  }), [query.data, search, status]);

  return <div className="catalog-page">
    <header className="catalog-heading"><div><span className="overview-kicker">Coach Library</span><h1>{config.title}</h1><p>{config.description}</p></div><button onClick={() => setEditor('new')}><AppIcon name="add-player" size={17} /> Create {config.singular}</button></header>
    <div className="catalog-toolbar">
      <label className="catalog-search"><span className="sr-only">Search {config.title}</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} /></label>
      <div className="catalog-tabs" role="tablist" aria-label="Lifecycle filter">{(['active','draft','published','archived'] as const).map((value) => <button key={value} role="tab" aria-selected={status === value} className={status === value ? 'active' : ''} onClick={() => setStatus(value)}>{value}</button>)}</div>
    </div>
    {query.isLoading && <LoadingSkeleton rows={5} />}
    {query.error && <p className="error" role="alert">{(query.error as Error).message}</p>}
    {!query.isLoading && !query.error && <div className="catalog-grid" aria-live="polite">{rows.map((item) => <article className="catalog-card" key={item.id}>
      <div className="catalog-card-top"><span className={`catalog-status ${item.lifecycle}`}>{item.lifecycle}</span><span>v{item.revision}</span></div>
      <h2>{item.title}</h2><p>{item.summary || `No ${config.singular} description yet.`}</p>
      <dl><div><dt>Visibility</dt><dd>{item.share_mode === 'workspace' ? 'Team workspace' : 'Private'}</dd></div><div><dt>Updated</dt><dd>{new Date(item.updated_at).toLocaleDateString()}</dd></div></dl>
      <footer><button className="secondary" onClick={() => setEditor(item)}>Edit</button><button className="secondary" onClick={() => duplicate.mutate(item)}>Duplicate</button>{item.lifecycle !== 'published' && <button className="secondary" disabled={publish.isPending} onClick={() => publish.mutate(item.id)}>{publish.isPending ? 'Publishing…' : 'Publish'}</button>}<button className="danger" onClick={() => window.confirm(`Archive ${item.title}? Existing player history will be preserved.`) && archive.mutate(item.id)}>Archive</button></footer>
    </article>)}</div>}
    {!query.isLoading && !query.error && rows.length === 0 && <div className="catalog-empty"><AppIcon name="library" size={34} /><h2>No {config.title.toLowerCase()} found</h2><p>Create the first reusable {config.singular}, or change the current search and status filters.</p><button onClick={() => setEditor('new')}><ActionButtonContent action="create">Create {config.singular}</ActionButtonContent></button></div>}
    {publish.error && <p className="error" role="alert">Publish failed: {(publish.error as Error).message}</p>}
    {editor && <CatalogEditor kind={kind} item={editor === 'new' ? null : editor} onClose={() => setEditor(null)} onSaved={async () => { await refresh(); setEditor(null); }} />}
  </div>;
}

function CatalogEditor({ kind, item, onClose, onSaved }: { kind: LibraryKind; item: CoachLibraryItem | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const { session } = useAuth(); const config = configs[kind]; const dialogRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(item?.title ?? ''); const [summary, setSummary] = useState(item?.summary ?? '');
  const [lifecycle, setLifecycle] = useState<CatalogLifecycle>(item?.lifecycle ?? 'draft'); const [shareMode, setShareMode] = useState<CatalogShareMode>(item?.share_mode ?? 'private');
  const [subtype, setSubtype] = useState(String(item?.meta[config.subtypeLabel === 'Format' ? 'format' : config.subtypeLabel === 'Task type' ? 'task_type' : 'category'] ?? config.subtypeOptions?.[0] ?? ''));
  const [numberValue, setNumberValue] = useState(Number(item?.meta[kind === 'meal-plans' ? 'week_count' : kind === 'recipes' ? 'servings' : 'rounds'] ?? 1));
  const [unit, setUnit] = useState(String(item?.meta.default_unit ?? 'g'));
  const [availableFrom, setAvailableFrom] = useState(String(item?.meta.available_from ?? '')); const [availableUntil, setAvailableUntil] = useState(String(item?.meta.available_until ?? ''));
  const save = useMutation({ mutationFn: () => saveCoachLibraryItem(kind, session!.user.id, item?.id ?? null, { title, summary, lifecycle, shareMode, subtype, numberValue, unit, availableFrom, availableUntil }), onSuccess: onSaved });
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; dialogRef.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus(); const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; previous?.focus(); }; }, [onClose]);
  const titleId = `catalog-title-${kind}`;
  return <div className="catalog-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div ref={dialogRef} className="catalog-dialog" role="dialog" aria-modal="true" aria-labelledby={`${titleId}-heading`}>
    <header><div><span className="overview-kicker">{item ? 'Edit' : 'Create'}</span><h2 id={`${titleId}-heading`}>{config.singular}</h2></div><button className="secondary catalog-close" aria-label="Close editor" onClick={onClose}>×</button></header>
    <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }}>
      <div className="field"><label htmlFor={titleId}>Name <span aria-hidden="true">*</span></label><input id={titleId} required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} /></div>
      <div className="field"><label htmlFor={`${titleId}-summary`}>Description</label><textarea id={`${titleId}-summary`} rows={4} maxLength={4000} value={summary} onChange={(event) => setSummary(event.target.value)} /></div>
      {config.subtypeLabel && <div className="field"><label htmlFor={`${titleId}-subtype`}>{config.subtypeLabel}</label>{config.subtypeOptions ? <select id={`${titleId}-subtype`} value={subtype} onChange={(event) => setSubtype(event.target.value)}>{config.subtypeOptions.map((option) => <option key={option} value={option}>{option.replaceAll('_',' ')}</option>)}</select> : <input id={`${titleId}-subtype`} value={subtype} onChange={(event) => setSubtype(event.target.value)} />}</div>}
      {config.numberLabel && <div className="field"><label htmlFor={`${titleId}-number`}>{config.numberLabel}</label><input id={`${titleId}-number`} type="number" min={1} max={kind === 'meal-plans' ? 52 : 100} value={numberValue} onChange={(event) => setNumberValue(Number(event.target.value))} /></div>}
      {config.unit && <div className="field"><label htmlFor={`${titleId}-unit`}>Default unit</label><input id={`${titleId}-unit`} value={unit} onChange={(event) => setUnit(event.target.value)} /></div>}
      {kind === 'forms' && <div className="catalog-form-row"><div className="field"><label htmlFor={`${titleId}-from`}>Available from</label><input id={`${titleId}-from`} type="date" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} /></div><div className="field"><label htmlFor={`${titleId}-until`}>Available until</label><input id={`${titleId}-until`} type="date" min={availableFrom || undefined} value={availableUntil} onChange={(event) => setAvailableUntil(event.target.value)} /></div></div>}
      {kind !== 'ingredients' && <div className="catalog-form-row"><div className="field"><label htmlFor={`${titleId}-status`}>Status</label><select id={`${titleId}-status`} value={lifecycle} onChange={(event) => setLifecycle(event.target.value as CatalogLifecycle)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div><div className="field"><label htmlFor={`${titleId}-share`}>Visibility</label><select id={`${titleId}-share`} value={shareMode} onChange={(event) => setShareMode(event.target.value as CatalogShareMode)}><option value="private">Private</option><option value="workspace">Team workspace</option></select></div></div>}
      {item && <LibraryRelationsEditor kind={kind} parentId={item.id} coachId={session!.user.id} />}
      {save.error && <p className="error" role="alert">{(save.error as Error).message}</p>}
      <footer><button type="button" className="secondary" onClick={onClose}><ActionButtonContent>Cancel</ActionButtonContent></button><button type="submit" disabled={!title.trim() || save.isPending}><ActionButtonContent action="save">{save.isPending ? 'Saving…' : `Save ${config.singular}`}</ActionButtonContent></button></footer>
    </form>
  </div></div>;
}

function LibraryRelationsEditor({ kind, parentId, coachId }: { kind: LibraryKind; parentId: string; coachId: string }) {
  const supported = !['tasks','ingredients'].includes(kind); const [choiceId, setChoiceId] = useState(''); const [label, setLabel] = useState(''); const [subtype, setSubtype] = useState('short_text'); const [amount, setAmount] = useState(1); const [secondaryAmount, setSecondaryAmount] = useState(kind === 'sections' ? 60 : 1); const [unit, setUnit] = useState(kind === 'recipes' ? 'Gram' : 'g'); const [required, setRequired] = useState(false); const [mealType,setMealType]=useState<'meal'|'snack'>('meal'); const [newIngredient,setNewIngredient]=useState(false);
  const query = useQuery({ queryKey: ['library-relations', kind, parentId], queryFn: () => listLibraryRelations(kind, parentId, coachId), enabled: supported });
  const refresh = () => query.refetch(); const add = useMutation({ mutationFn: () => addLibraryRelation(kind, parentId, { choiceId, label, subtype, amount, secondaryAmount, unit, required, mealType }), onSuccess: async () => { await refresh(); setChoiceId(''); setLabel(''); } });
  const createMetric = useMutation({ mutationFn: () => createMeasurementForGroup(coachId, parentId, label, unit), onSuccess: async () => { await refresh(); setLabel(''); } });
  const remove = useMutation({ mutationFn: (row: NonNullable<typeof query.data>['rows'][number]) => removeLibraryRelation(kind, row), onSuccess: refresh });
  if (!supported) return null;
  const needsChoice = kind !== 'forms'; const canAdd = kind === 'forms' ? !!label.trim() : !!choiceId;
  return <fieldset className="catalog-relations"><legend>{relationHeading(kind)}</legend>
    {query.isLoading && <span className="muted">Loading items…</span>}
    {query.error && <p className="error" role="alert">{(query.error as Error).message}</p>}
    <div className="catalog-relation-list">{query.data?.rows.map((row) => <div key={row.id}><span><strong>{row.title}</strong><small>{row.detail}</small></span><button type="button" className="secondary" aria-label={`Remove ${row.title}`} onClick={() => remove.mutate(row)}>Remove</button></div>)}</div>
    <div className="catalog-relation-add">
      {needsChoice && <label>Library item<select value={choiceId} onChange={(event) => setChoiceId(event.target.value)}><option value="">Choose an item</option>{query.data?.choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.title}</option>)}</select></label>}
      {kind === 'metric-groups' && <><label>New measurement<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Body weight" /></label><label>Unit<input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="kg" /></label><button type="button" disabled={!label.trim() || !unit.trim() || createMetric.isPending} onClick={() => createMetric.mutate()}>Create measurement</button></>}
      {kind === 'forms' && <><label>Question<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="What would you like to ask?" /></label><label>Answer type<select value={subtype} onChange={(event) => setSubtype(event.target.value)}><option value="short_text">Short text</option><option value="long_text">Long text</option><option value="number">Number</option><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="date">Date</option><option value="yes_no">Yes / No</option></select></label><label className="catalog-check"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /> Required</label></>}
      {kind === 'sections' && <><label>Reps / target<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="8-12" /></label><label>Sets<input type="number" min="1" max="100" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label>Rest seconds<input type="number" min="0" max="86400" value={secondaryAmount} onChange={(event) => setSecondaryAmount(Number(event.target.value))} /></label></>}
      {kind === 'recipes' && <><label>Quantity<input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label>Unit<IngredientUnitSelect value={unit} onChange={setUnit} /></label></>}
      {kind === 'meal-plans' && <><label>Meal name<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Breakfast" /></label><label>Type<select value={mealType} onChange={(event)=>setMealType(event.target.value as 'meal'|'snack')}><option value="meal">Meal</option><option value="snack">Snack</option></select></label><label>Week<input type="number" min="1" max="52" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label>Day<input type="number" min="1" max="7" value={secondaryAmount} onChange={(event) => setSecondaryAmount(Number(event.target.value))} /></label></>}
      <button type="button" disabled={!canAdd || add.isPending} onClick={() => add.mutate()}>{add.isPending ? 'Adding…' : 'Add item'}</button>
      {kind==='recipes'&&<button type="button" className="secondary" onClick={()=>setNewIngredient(true)}>+ New ingredient</button>}
    </div>{add.error && <p className="error" role="alert">{(add.error as Error).message}</p>}{newIngredient&&<IngredientEditor coachId={coachId} mode="single" onClose={()=>setNewIngredient(false)} onSaved={async()=>{await refresh();setNewIngredient(false)}}/>}
  </fieldset>;
}

function relationHeading(kind: LibraryKind) { return ({ sections: 'Exercise prescriptions', forms: 'Questions', 'meal-plans': 'Scheduled meals', recipes: 'Ingredients', 'recipe-books': 'Recipes', 'metric-groups': 'Measurements' } as Partial<Record<LibraryKind,string>>)[kind] ?? 'Items'; }
