import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { listPlayersForCoach } from '../../api/players';
import { generateXlsxTemplate, importFromXlsx } from '../../api/programs';

export default function CoachSettings() {
  const { session } = useAuth();
  const coachId = session!.user.id;
  const qc = useQueryClient();

  const { data: players } = useQuery({
    queryKey: ['players', coachId],
    queryFn: () => listPlayersForCoach(coachId),
  });

  // Only claimed players can receive an import.
  const claimed = (players ?? []).filter((p) => p.profile !== null);
  const [playerId, setPlayerId] = useState('');

  const importXlsx = useMutation({
    mutationFn: (file: File) => importFromXlsx(file, playerId, coachId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['program', playerId] }),
  });

  async function handleXlsxFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const player = claimed.find((p) => p.profile!.id === playerId);
    const name = player?.profile?.name ?? player?.profile?.email ?? 'this player';
    if (!confirm(`Import will REPLACE the entire existing program for ${name}. Continue?`)) {
      e.target.value = '';
      return;
    }
    importXlsx.mutate(file);
    e.target.value = '';
  }

  return (
    <div className="stack">
      <h1>Settings</h1>

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
          <select value={playerId} onChange={(e) => { setPlayerId(e.target.value); importXlsx.reset(); }}>
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
              cursor: !playerId || importXlsx.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: !playerId ? 0.5 : 1,
            }}
          >
            {importXlsx.isPending ? 'Importing…' : 'Import Excel…'}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleXlsxFile}
              disabled={!playerId || importXlsx.isPending}
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
