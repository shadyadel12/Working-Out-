import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { listPlayersForCoach, coachCreatePlayerKey } from '../../api/players';
import { generateXlsxTemplate, importFromXlsx } from '../../api/programs';
import type { CoachPlayerLink } from '../../types/database.types';

function statusBadge(link: CoachPlayerLink) {
  const expired = new Date(link.subscription_end_date) < new Date();
  if (link.status === 'revoked') return <span className="badge danger">Revoked</span>;
  if (expired) return <span className="badge danger">Expired</span>;
  return <span className="badge active">Active</span>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Returns a date string YYYY-MM-DD N months from today. */
function monthsFromToday(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

export default function CoachSettings() {
  const { session } = useAuth();
  const coachId = session!.user.id;
  const qc = useQueryClient();

  const { data: players } = useQuery({
    queryKey: ['players', coachId],
    queryFn: () => listPlayersForCoach(coachId),
  });

  const claimed = (players ?? []).filter((p) => p.profile !== null);

  // Excel import state
  const [importPlayerId, setImportPlayerId] = useState('');
  const importXlsx = useMutation({
    mutationFn: (file: File) => importFromXlsx(file, importPlayerId, coachId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['program', importPlayerId] }),
  });
  async function handleXlsxFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const player = claimed.find((p) => p.profile!.id === importPlayerId);
    const name = player?.profile?.name ?? player?.profile?.email ?? 'this player';
    if (!confirm(`Import will REPLACE the entire existing program for ${name}. Continue?`)) {
      e.target.value = '';
      return;
    }
    importXlsx.mutate(file);
    e.target.value = '';
  }

  // Key generation state
  const [openKeyFor, setOpenKeyFor] = useState<string | null>(null);
  const [endDate, setEndDate] = useState(monthsFromToday(1));
  // Map playerId → newly generated key (to display after success)
  const [shownKeys, setShownKeys] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const genKey = useMutation({
    mutationFn: ({ playerId, date }: { playerId: string; date: string }) =>
      coachCreatePlayerKey(playerId, date),
    onSuccess: (link, { playerId }) => {
      qc.invalidateQueries({ queryKey: ['players', coachId] });
      setShownKeys((prev) => ({ ...prev, [playerId]: link.subscription_key }));
      setOpenKeyFor(null);
    },
  });

  function copyKey(playerId: string, key: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(playerId);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="stack">
      <h1>Settings</h1>

      {/* ── Player subscriptions ─────────────────────────────── */}
      <div className="card stack">
        <div>
          <strong>Player subscriptions</strong>
          <p className="muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Generate or renew a subscription key for any of your players.
            Share the key with the player — they enter it at login to activate access.
          </p>
        </div>

        {/* Future: payment gateway placeholder */}
        <div
          style={{
            padding: '0.7rem 1rem',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-2)',
            border: '1px dashed var(--border)',
            fontSize: '0.85rem',
            color: 'var(--text-dim)',
          }}
        >
          Coming soon — online payments. Coaches will be able to purchase key packages
          directly from this page.
        </div>

        {claimed.length === 0 ? (
          <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
            No players yet. Ask an admin to create player accounts and link them to you.
          </p>
        ) : (
          <div className="stack" style={{ gap: '0.6rem' }}>
            {claimed.map((p) => {
              const pid = p.profile!.id;
              const name = p.profile!.name ?? p.profile!.email;
              const link = p.link;
              const isOpen = openKeyFor === pid;
              const newKey = shownKeys[pid];

              return (
                <div
                  key={pid}
                  className="card stack"
                  style={{ background: 'var(--surface-2)', gap: '0.5rem' }}
                >
                  <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div>
                      <strong>{name}</strong>{' '}
                      {statusBadge(link)}
                      <span className="muted" style={{ fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                        Expires {fmtDate(link.subscription_end_date)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => {
                        setOpenKeyFor(isOpen ? null : pid);
                        setEndDate(monthsFromToday(1));
                        genKey.reset();
                      }}
                    >
                      {isOpen ? 'Cancel' : 'Generate key'}
                    </button>
                  </div>

                  {/* Newly generated key display */}
                  {newKey && !isOpen && (
                    <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input
                        readOnly
                        value={newKey}
                        style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                      />
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => copyKey(pid, newKey)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {copied === pid ? 'Copied ✓' : 'Copy key'}
                      </button>
                    </div>
                  )}

                  {/* Key generation form */}
                  {isOpen && (
                    <div className="stack" style={{ gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
                      <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="field" style={{ margin: 0 }}>
                          <label>Duration</label>
                          <select
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{ width: 'auto' }}
                          >
                            <option value={monthsFromToday(1)}>1 month</option>
                            <option value={monthsFromToday(3)}>3 months</option>
                            <option value={monthsFromToday(6)}>6 months</option>
                            <option value={monthsFromToday(12)}>1 year</option>
                          </select>
                        </div>
                        <div className="field" style={{ margin: 0 }}>
                          <label>Or pick a date</label>
                          <input
                            type="date"
                            value={endDate}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={genKey.isPending}
                          onClick={() => {
                            if (confirm(`Generate a new subscription key for ${name}?\nExpires: ${fmtDate(endDate)}\n\nThis replaces their current key.`)) {
                              genKey.mutate({ playerId: pid, date: endDate });
                            }
                          }}
                        >
                          {genKey.isPending ? 'Generating…' : 'Confirm & generate'}
                        </button>
                      </div>
                      {genKey.error && (
                        <span className="error">{(genKey.error as Error).message}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Excel import ─────────────────────────────────────── */}
      <div className="card stack">
        <strong>Program template</strong>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
          Download a blank Excel template, fill it with a full program (weeks, days,
          workouts, exercises), then import it for a player below.
        </p>
        <div>
          <button className="secondary" type="button" onClick={() => generateXlsxTemplate()}>
            Download template (.xlsx)
          </button>
        </div>
      </div>

      <div className="card stack">
        <strong>Import program from Excel</strong>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
          Choose a player, then upload a filled template. This replaces the player's
          entire existing program.
        </p>

        <div className="field" style={{ margin: 0, maxWidth: 360 }}>
          <label>Player</label>
          <select value={importPlayerId} onChange={(e) => { setImportPlayerId(e.target.value); importXlsx.reset(); }}>
            <option value="">— Select a player —</option>
            {claimed.map((p) => (
              <option key={p.profile!.id} value={p.profile!.id}>
                {p.profile!.name ?? p.profile!.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: 'inline-flex', alignItems: 'center', padding: '0.6em 1.1em',
              background: 'var(--surface-2)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              cursor: !importPlayerId || importXlsx.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: !importPlayerId ? 0.5 : 1,
            }}
          >
            {importXlsx.isPending ? 'Importing…' : 'Import Excel…'}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleXlsxFile}
              disabled={!importPlayerId || importXlsx.isPending}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {importXlsx.isSuccess && importXlsx.data && (
          <span className="badge active">
            Imported {importXlsx.data.daysCreated} days, {importXlsx.data.exercisesCreated} exercises ✓
          </span>
        )}
        {importXlsx.error && <span className="error">{(importXlsx.error as Error).message}</span>}
      </div>
    </div>
  );
}
