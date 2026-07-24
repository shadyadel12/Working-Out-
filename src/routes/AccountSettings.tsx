import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function AccountSettings() {
  const { session, profile } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function removeAccount() {
    if (!session?.user.email || confirmation !== 'DELETE' || !acknowledged) return;
    setBusy(true); setError('');
    try {
      if (password) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: session.user.email, password });
        if (authError) throw new Error('The password is incorrect. Sign in again and retry.');
      }
      const { error: deleteError } = await supabase.functions.invoke('account-delete', { body: {} });
      if (deleteError) throw deleteError;
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      localStorage.clear(); sessionStorage.clear(); window.location.assign('/');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Account deletion failed.'); setBusy(false); }
  }
  return <div className="stack" style={{ maxWidth: 720 }}>
    <div><h1>Account & Privacy</h1><p className="muted">Signed in as {profile?.name || profile?.email}</p></div>
    <section className="card stack"><h2>Legal and help</h2><p><Link to="/privacy">Privacy Policy</Link> · <Link to="/community-standards">Community Standards</Link> · <Link to="/terms">Terms</Link> · <Link to="/support">Support</Link></p></section>
    <section className="card stack" style={{ borderColor: 'var(--danger, #c33)' }}>
      <h2>Delete account</h2><p>This permanently removes your sign-in and account data and deletes or schedules deletion of private files. Minimal pseudonymous legal, security, and moderation records may be kept for up to 24 months.</p>
      <label className="field"><span>Current password (required to authenticate again)</span><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      <label><input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} /> I understand this cannot be undone.</label>
      <label className="field"><span>Type DELETE to confirm</span><input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label>
      {error && <p className="error">{error}</p>}
      <button className="danger" disabled={busy || !acknowledged || confirmation !== 'DELETE' || !password} onClick={removeAccount}>{busy ? 'Deleting…' : 'Permanently delete my account'}</button>
    </section>
  </div>;
}
