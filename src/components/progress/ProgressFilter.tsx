/** Reusable select control for workout progress filters. */
export default function Filter({ label, value, all, options, onChange }: { label: string; value: string; all: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="field" style={{ margin: 0, flex: 1, minWidth: 160 }}><label>{label}</label><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{all}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></div>;
}
