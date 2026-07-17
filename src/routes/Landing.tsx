import { Link } from 'react-router-dom';

/** Landing / role chooser — first screen a user sees. */
export default function Landing() {
  return (
    <div className="center-screen" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      <div className="stack" style={{ maxWidth: 420, width: '100%', textAlign: 'center', flex: 1, justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
        <div>
          <h1>Coach Platform</h1>
          <p className="muted">Train together. Choose how you'll sign in.</p>
        </div>

        <div className="stack">
          <Link to="/login/coach">
            <button style={{ width: '100%' }}>I'm a Coach</button>
          </Link>
          <Link to="/login/player">
            <button className="secondary" style={{ width: '100%' }}>
              I'm a Player
            </button>
          </Link>
        </div>

        <Link to="/login/admin" className="muted" style={{ fontSize: '0.85rem' }}>
          Admin sign in
        </Link>
      </div>

      <footer style={{
        textAlign: 'center',
        padding: '1rem',
        fontSize: '0.78rem',
        color: '#888',
        borderTop: '1px solid var(--border)',
        width: '100%',
      }}>
        © {new Date().getFullYear()} Coach Platform. All rights reserved. ·{' '}
        <Link to="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Use</Link>
      </footer>
    </div>
  );
}
