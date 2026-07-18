import { useEffect, useRef, useState } from 'react';

export default function MultiSelectDropdown({ options, value, onChange, placeholder, max }: { options: string[]; value: string[]; onChange: (value: string[]) => void; placeholder: string; max?: number }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  function toggle(option: string) {
    if (value.includes(option)) onChange(value.filter((item) => item !== option));
    else if (!max || value.length < max) onChange([...value, option]);
  }
  return <div className="multi-select" ref={root}>
    <button type="button" className="multi-select-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <span className={value.length ? 'multi-select-values' : 'multi-select-placeholder'}>{value.length ? value.map((item) => <span key={item}>{item}</span>) : placeholder}</span>
      <span className="multi-select-arrow">⌄</span>
    </button>
    {open && <div className="multi-select-menu">{options.map((option) => {
      const checked = value.includes(option); const disabled = !checked && !!max && value.length >= max;
      return <label key={option} className={disabled ? 'disabled' : ''}><input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(option)} /><span>{option}</span></label>;
    })}</div>}
    {max && <small>{value.length} of {max} selected</small>}
  </div>;
}
