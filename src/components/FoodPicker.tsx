import { useRef, useState } from 'react';

/**
 * Combo input for food types: type freely, or pick from the coach's
 * food library. Custom dropdown (not <datalist>) so it works on iOS.
 */
export default function FoodPicker({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const q = value.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.toLowerCase().includes(q) && o.toLowerCase() !== q)
    : options;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a tap on an option registers before the list closes.
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder ?? 'Choose or type new…'}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 30,
            marginTop: 4,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            maxHeight: 200,
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          {filtered.map((o) => (
            <div
              key={o}
              // onMouseDown fires before the input's blur — works for touch too.
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(o);
                setOpen(false);
              }}
              style={{
                padding: '0.55em 0.8em',
                cursor: 'pointer',
                fontSize: '0.92rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
