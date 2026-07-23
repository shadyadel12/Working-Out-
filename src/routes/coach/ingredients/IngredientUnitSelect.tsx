export const INGREDIENT_UNIT_GROUPS = [
  { label: 'Imperial · Volume', units: ['Teaspoon', 'Tablespoon', 'Fluid Ounce', 'Cup', 'Pint', 'Quart', 'Gallon'] },
  { label: 'Imperial · Mass', units: ['Ounce', 'Pound'] },
  { label: 'Metric · Volume', units: ['Milliliter', 'Liter'] },
  { label: 'Metric · Mass', units: ['Milligram', 'Gram', 'Kilogram'] },
  { label: 'Other · Size', units: ['Small', 'Medium', 'Large'] },
  { label: 'Other · Container', units: ['Block', 'Box'] },
  { label: 'Other · Produce', units: ['Clove', 'Bulb', 'Head'] },
  { label: 'Other · Scoop', units: ['Spoonful', 'Scoop'] },
  { label: 'Other · Serving', units: ['Unit'] },
  { label: 'Other', units: ['Splash', 'Loaf', 'Cubic Inch'] },
] as const;

interface IngredientUnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function IngredientUnitSelect({ value, onChange, required }: IngredientUnitSelectProps) {
  const known = INGREDIENT_UNIT_GROUPS.some((group) => group.units.some((unit) => unit === value));
  return <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
    {!known && value && <option value={value}>{value}</option>}
    {INGREDIENT_UNIT_GROUPS.map((group) => <optgroup key={group.label} label={group.label}>
      {group.units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
    </optgroup>)}
  </select>;
}
