import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signUp, signIn, claimCoachKey, checkCoachKey, signOut } from '../../api/auth';
import { checkTeamInvite, claimTeamInvite } from '../../api/team';
import ActionButtonContent from '../../components/ActionButtonContent';

/** Coach self-serve signup: name + email + password + single-use coach key. */
export default function CoachSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [coachKey, setCoachKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signupType, setSignupType] = useState<'owner' | 'team'>('owner');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      // 1) Validate the key BEFORE creating any account (no orphan accounts).
      const valid = signupType === 'team' ? await checkTeamInvite(coachKey) : await checkCoachKey(coachKey);
      if (!valid) {
        throw new Error('Invalid or already-used coach key.');
      }
      // 2) Create the account, then consume the key to become a coach.
      await signUp(email, password, name);
      await signIn(email, password).catch(() => {});
      if (signupType === 'team') await claimTeamInvite(coachKey); else await claimCoachKey(coachKey);
      // Full reload so AuthContext re-fetches the profile with the new role.
      window.location.assign('/coach/dashboard');
    } catch (err) {
      await signOut().catch(() => {});
      setError(err instanceof Error ? err.message : 'Signup failed.');
      setBusy(false);
    }
  }

  return (
    <div className="center-screen">
      <form className="card stack" style={{ width: '100%', maxWidth: 400 }} onSubmit={handleSubmit}>
        <h2>Coach sign up</h2>
        <p className="muted" style={{ marginTop: '-0.5rem', fontSize: '0.85rem' }}>
          {signupType === 'owner' ? 'Create an owner coach account.' : 'Join a coach team using your invitation key.'}
        </p>
        <div className="auth-choice"><button type="button" className={signupType === 'owner' ? '' : 'secondary'} onClick={() => setSignupType('owner')}>Coach Owner</button><button type="button" className={signupType === 'team' ? '' : 'secondary'} onClick={() => setSignupType('team')}>Team Member</button></div>
        <div className="field">
          <label htmlFor="coach-signup-name">Name</label>
          <input id="coach-signup-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="coach-signup-email">Email</label>
          <input id="coach-signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="coach-signup-password">Password</label>
          <input id="coach-signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
        </div>
        <div className="field">
          <label htmlFor="coach-signup-key">{signupType === 'team' ? 'Team invitation key' : 'Coach key'}</label>
          <input id="coach-signup-key" value={coachKey} onChange={(e) => setCoachKey(e.target.value)} required placeholder={signupType === 'team' ? 'TEAM-XXXXXXXXXXXX' : 'KEY-COACH-XXXX'} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          <ActionButtonContent action="create account">{busy ? 'Creating account…' : 'Sign up'}</ActionButtonContent>
        </button>
        <div className="row" style={{ justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <Link to="/login/coach" className="muted">Already have an account?</Link>
          <Link to="/" className="muted">← Back</Link>
        </div>
      </form>
    </div>
  );
}
