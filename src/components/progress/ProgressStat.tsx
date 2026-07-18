/** Displays one summary value on a progress page. */
export default function Stat({ label, value }: { label: string; value: number }) {
  return <div className="card" style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</div><div className="muted">{label}</div></div>;
}
