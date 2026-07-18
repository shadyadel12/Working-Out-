import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type State =
  | { kind: 'loading' }
  | { kind: 'enroll'; factorId: string; qrCode: string; secret: string }
  | { kind: 'verify'; factorId: string }
  | { kind: 'ready' }
  | { kind: 'error'; message: string };

/** Requires an AAL2 session before rendering any admin interface. */
export default function RequireAdminMfa({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void prepareMfa();
  }, []);

  async function prepareMfa() {
    setState({ kind: 'loading' });
    const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) return setState({ kind: 'error', message: assuranceError.message });
    if (assurance.currentLevel === 'aal2') return setState({ kind: 'ready' });

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) return setState({ kind: 'error', message: factorsError.message });
    const verified = factors.totp.find((factor) => factor.status === 'verified');
    if (verified) return setState({ kind: 'verify', factorId: verified.id });

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Coach Platform admin',
    });
    if (error) return setState({ kind: 'error', message: error.message });
    setState({
      kind: 'enroll',
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if ((state.kind !== 'enroll' && state.kind !== 'verify') || !/^\d{6}$/.test(code)) return;
    setSubmitting(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: state.factorId,
      code,
    });
    setSubmitting(false);
    if (error) return setState({ kind: 'error', message: error.message });
    setState({ kind: 'ready' });
  }

  if (state.kind === 'ready') return <>{children}</>;
  if (state.kind === 'loading') return <div className="center-screen"><p className="muted">Checking admin security…</p></div>;

  return (
    <main className="center-screen">
      <section className="card" style={{ width: 'min(430px, 92vw)' }}>
        <h1>Admin verification</h1>
        {state.kind === 'error' ? (
          <>
            <p className="error">{state.message}</p>
            <button type="button" onClick={() => void prepareMfa()}>Try again</button>
          </>
        ) : (
          <form onSubmit={verify}>
            {state.kind === 'enroll' && (
              <>
                <p>Scan this QR code with your authenticator app, then enter its six-digit code.</p>
                <img src={state.qrCode} alt="Authenticator enrollment QR code" style={{ display: 'block', maxWidth: 240, margin: '1rem auto' }} />
                <p className="muted">Manual key: <code>{state.secret}</code></p>
              </>
            )}
            {state.kind === 'verify' && <p>Enter the six-digit code from your authenticator app.</p>}
            <div className="field">
              <label htmlFor="admin-mfa-code">Authenticator code</label>
              <input
                id="admin-mfa-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                required
                autoFocus
              />
            </div>
            <button type="submit" disabled={submitting || code.length !== 6}>
              {submitting ? 'Verifying…' : 'Verify'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
