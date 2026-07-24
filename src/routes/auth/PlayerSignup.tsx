import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signUpAndEnsureSession, checkSubscriptionKey, signOut, getErrorMessage } from '../../api/auth';
import ActionButtonContent from '../../components/ActionButtonContent';

/** Player self-serve signup: name + email + password + subscription key. */
export default function PlayerSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // 1) Validate the key BEFORE creating any account (no orphan accounts).
      const valid = await checkSubscriptionKey(key);
      if (!valid) {
        throw new Error('Invalid or already-used subscription key.');
      }
      // 2) Account creation and key consumption are one database transaction.
      await signUpAndEnsureSession(email, password, name, 'player', key);
      // Full reload so AuthContext loads the fresh subscription.
      window.location.assign('/player/program');
    } catch (err) {
      await signOut().catch(() => {});
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card stack" style={{ width: '100%', maxWidth: 400 }} onSubmit={handleSubmit}>
        <h2>Player sign up</h2>
        <p className="muted" style={{ marginTop: '-0.5rem', fontSize: '0.85rem' }}>
          Enter the coaching access key your coach gave you.
        </p>
        <div className="field">
          <label htmlFor="player-signup-name">Name</label>
          <input id="player-signup-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="player-signup-email">Email</label>
          <input id="player-signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="player-signup-password">Password</label>
          <input id="player-signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}" title="Use at least 8 characters with uppercase, lowercase, a number, and a symbol." autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="player-signup-key">Subscription key</label>
          <input id="player-signup-key" value={key} onChange={(e) => setKey(e.target.value)} required placeholder="KEY-XXXX-XXXX" />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          <ActionButtonContent action="create account">{busy ? 'Creating account…' : 'Sign up'}</ActionButtonContent>
        </button>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <Link to="/login/player" className="muted">Already have an account?</Link>
          <Link to="/" className="muted">← Back</Link>
        </div>
      </form>
    </div>
  );
}
