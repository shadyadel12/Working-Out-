import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { listPlayersForCoach, coachCreateUnclaimedKey, coachCreatePlayerKey } from '../../api/players';
import { generateXlsxTemplate, importFromXlsx } from '../../api/programs';
import { generateDietXlsxTemplate, importDietFromXlsx } from '../../api/diet';
import type { CoachPlayerLink } from '../../types/database.types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function isExpired(link: CoachPlayerLink) {
  return new Date(link.subscription_end_date) < new Date();
}

function monthsFromToday(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  }
  return (
    <button type="button" className="secondary" onClick={copy} style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
      {done ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

export default function CoachSettings() {
  const { session } = useAuth();
  const coachId = session!.user.id;
  const qc = useQueryClient();

  const { data: players } = useQuery({
    queryKey: ['players', coachId],
    queryFn: () => listPlayersForCoach(coachId),
  });

  const unclaimed = (players ?? []).filter((p) => p.profile === null);
  const claimed   = (players ?? []).filter((p) => p.profile !== null);

  // ── Generate unclaimed key ──────────────────────────────────────
  const [newKeyDate, setNewKeyDate] = useState(monthsFromToday(1));
  const [lastKey, setLastKey] = useState<string | null>(null);

  const genUnclaimed = useMutation({
    mutationFn: () => coachCreateUnclaimedKey(newKeyDate),
    onSuccess: (link) => {
      qc.invalidateQueries({ queryKey: ['players', coachId] });
      setLastKey(link.subscription_key);
    },
  });

  // ── Renew existing player's key ─────────────────────────────────
  const [openRenewFor, setOpenRenewFor] = useState<string | null>(null);
  const [renewDate, setRenewDate] = useState(monthsFromToday(1));

  const genRenew = useMutation({
    mutationFn: ({ playerId, date }: { playerId: string; date: string }) =>
      coachCreatePlayerKey(playerId, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players', coachId] });
      setOpenRenewFor(null);
    },
  });

  // ── Excel import ────────────────────────────────────────────────
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

  const [dietImportPlayerId, setDietImportPlayerId] = useState('');
  const importDietXlsx = useMutation({
    mutationFn: (file: File) => importDietFromXlsx(file, dietImportPlayerId, coachId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet', dietImportPlayerId] });
      qc.invalidateQueries({ queryKey: ['coachFoods', coachId] });
    },
  });
  function handleDietXlsxFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const player = claimed.find((item) => item.profile!.id === dietImportPlayerId);
    const name = player?.profile?.name ?? player?.profile?.email ?? 'this player';
    if (confirm(`Import will REPLACE the entire existing diet plan for ${name}. Continue?`)) importDietXlsx.mutate(file);
    e.target.value = '';
  }

  return (
    <div className="stack">
      <h1>Settings</h1>

      {/* ── Generate new key ───────────────────────────────────── */}
      <div className="card stack">
        <div>
          <strong>Generate player key</strong>
          <p className="muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Create a key and share it with a new player. They sign up on the website,
            enter the key, and are linked to your account automatically.
          </p>
        </div>

        <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Duration</label>
            <select value={newKeyDate} onChange={(e) => setNewKeyDate(e.target.value)} style={{ width: 'auto' }}>
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
              value={newKeyDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setNewKeyDate(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={genUnclaimed.isPending}
            onClick={() => { setLastKey(null); genUnclaimed.mutate(); }}
          >
            {genUnclaimed.isPending ? 'Generating…' : 'Generate key'}
          </button>
        </div>

        {lastKey && (
          <div className="row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              readOnly
              value={lastKey}
              style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.08em', fontWeight: 600 }}
            />
            <CopyButton text={lastKey} />
          </div>
        )}
        {genUnclaimed.error && (
          <span className="error">{(genUnclaimed.error as Error).message}</span>
        )}

        {/* Coming soon: payment gateway */}
        <div style={{
          padding: '0.6rem 0.9rem', borderRadius: 'var(--radius)',
          background: 'var(--surface-2)', border: '1px dashed var(--border)',
          fontSize: '0.82rem', color: 'var(--text-dim)',
        }}>
          Coming soon — buy key packages online. After payment, keys are generated automatically.
        </div>
      </div>

      {/* ── Unclaimed keys ─────────────────────────────────────── */}
      {unclaimed.length > 0 && (
        <div className="card stack">
          <strong>Pending keys <span className="muted" style={{ fontSize: '0.85rem', fontWeight: 400 }}>— not yet claimed by a player</span></strong>
          <div className="stack" style={{ gap: '0.4rem' }}>
            {unclaimed.map(({ link }) => (
              <div key={link.id} className="row" style={{ gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  readOnly
                  value={link.subscription_key}
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.88rem', letterSpacing: '0.06em' }}
                />
                <span className="muted" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                  Exp. {fmtDate(link.subscription_end_date)}
                </span>
                <CopyButton text={link.subscription_key} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Active players ─────────────────────────────────────── */}
      {claimed.length > 0 && (
        <div className="card stack">
          <strong>Active players</strong>
          <div className="stack" style={{ gap: '0.6rem' }}>
            {claimed.map((p) => {
              const pid = p.profile!.id;
              const name = p.profile!.name ?? p.profile!.email;
              const link = p.link;
              const expired = isExpired(link);
              const isOpen = openRenewFor === pid;

              return (
                <div key={pid} className="card stack" style={{ background: 'var(--surface-2)', gap: '0.45rem' }}>
                  <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <div>
                      <strong>{name}</strong>{' '}
                      {link.status === 'revoked'
                        ? <span className="badge danger">Revoked</span>
                        : expired
                          ? <span className="badge danger">Expired</span>
                          : <span className="badge active">Active</span>}
                      <span className="muted" style={{ fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                        Exp. {fmtDate(link.subscription_end_date)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      style={{ fontSize: '0.85rem' }}
                      onClick={() => {
                        setOpenRenewFor(isOpen ? null : pid);
                        setRenewDate(monthsFromToday(1));
                        genRenew.reset();
                      }}
                    >
                      {isOpen ? 'Cancel' : 'Renew key'}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="stack" style={{ gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
                      <div className="row" style={{ gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div className="field" style={{ margin: 0 }}>
                          <label>Duration</label>
                          <select value={renewDate} onChange={(e) => setRenewDate(e.target.value)} style={{ width: 'auto' }}>
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
                            value={renewDate}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => setRenewDate(e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          disabled={genRenew.isPending}
                          onClick={() => {
                            if (confirm(`Generate a new key for ${name}?\nExpires: ${fmtDate(renewDate)}\n\nThis replaces their current key.`)) {
                              genRenew.mutate({ playerId: pid, date: renewDate });
                            }
                          }}
                        >
                          {genRenew.isPending ? 'Renewing…' : 'Confirm & renew'}
                        </button>
                      </div>
                      {genRenew.isSuccess && <span className="badge active">Key renewed ✓</span>}
                      {genRenew.error && <span className="error">{(genRenew.error as Error).message}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Excel template & import ────────────────────────────── */}
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
          Choose a player, then upload a filled template. This replaces the player's entire existing program.
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
          <label style={{
            display: 'inline-flex', alignItems: 'center', padding: '0.6em 1.1em',
            background: 'var(--surface-2)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            cursor: !importPlayerId || importXlsx.isPending ? 'not-allowed' : 'pointer',
            fontWeight: 600, opacity: !importPlayerId ? 0.5 : 1,
          }}>
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

      <div className="card stack">
        <strong>Diet template</strong>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>Download the blank diet workbook, fill in its weeks and days, then import it for a selected player.</p>
        <div><button className="secondary" type="button" onClick={generateDietXlsxTemplate}>Download diet template (.xlsx)</button></div>
      </div>

      <div className="card stack">
        <strong>Import diet from Excel</strong>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>Choose a player first. Importing replaces that player's entire diet plan.</p>
        <div className="field" style={{ margin: 0, maxWidth: 360 }}>
          <label>Player</label>
          <select value={dietImportPlayerId} onChange={(e) => { setDietImportPlayerId(e.target.value); importDietXlsx.reset(); }}>
            <option value="">— Select a player —</option>
            {claimed.map((player) => <option key={player.profile!.id} value={player.profile!.id}>{player.profile!.name ?? player.profile!.email}</option>)}
          </select>
        </div>
        <div><label style={{ display: 'inline-flex', alignItems: 'center', padding: '0.6em 1.1em', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', cursor: !dietImportPlayerId || importDietXlsx.isPending ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: dietImportPlayerId ? 1 : 0.5 }}>
          {importDietXlsx.isPending ? 'Importing…' : 'Import diet Excel…'}
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleDietXlsxFile} disabled={!dietImportPlayerId || importDietXlsx.isPending} style={{ display: 'none' }} />
        </label></div>
        {importDietXlsx.isSuccess && <span className="badge active">Imported {importDietXlsx.data.daysCreated} days, {importDietXlsx.data.mealsCreated} meals, and {importDietXlsx.data.foodsCreated} food rows ✓</span>}
        {importDietXlsx.error && <span className="error">{(importDietXlsx.error as Error).message}</span>}
      </div>
    </div>
  );
}
