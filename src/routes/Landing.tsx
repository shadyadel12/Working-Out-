import { Link } from 'react-router-dom';

/** Landing / role chooser — first screen a user sees. PulseFit-style hero. */
export default function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage:
          'linear-gradient(rgba(10, 10, 12, 0.82), rgba(10, 10, 12, 0.88)), url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10, 10, 12, 0.55)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div className="row" style={{ gap: '0.6rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 9,
              background: 'linear-gradient(135deg, #f9702b, #f9502b)',
              fontSize: '1.1rem',
            }}
          >
            ⚡
          </span>
          <strong style={{ fontSize: '1.15rem', letterSpacing: '0.02em' }}>
            COACH<span className="accent-text">PLATFORM</span>
          </strong>
        </div>
        <div className="row">
          <Link to="/changelog" className="muted" style={{ fontSize: '0.85rem' }}>
            Changelog
          </Link>
          <Link to="/login/admin" className="muted" style={{ fontSize: '0.85rem' }}>
            Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 1.5rem',
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            border: '1px solid var(--border)',
            borderRadius: 999,
            padding: '0.35em 1em',
            fontSize: '0.78rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '1.4rem',
          }}
        >
          <span style={{ color: 'var(--success)' }}>●</span> Personal coaching platform
        </span>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 8vw, 4.2rem)',
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Transform
          <br />
          Your Body
          <br />
          <span className="accent-text">Your Life</span>
        </h1>

        <p className="muted" style={{ maxWidth: 480, margin: '1.4rem 0 2rem', fontSize: '1.05rem' }}>
          Train with your personal coach — custom programs, diet plans, progress
          tracking, and private chat. Choose how you'll sign in.
        </p>

        <div className="row" style={{ flexWrap: 'wrap', gap: '0.8rem' }}>
          <Link to="/login/coach">
            <button style={{ padding: '0.9em 2em' }}>I'm a Coach →</button>
          </Link>
          <Link to="/login/player">
            <button className="secondary" style={{ padding: '0.9em 2em' }}>
              I'm a Player
            </button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="row" style={{ gap: '2.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
          {[
            ['Custom', 'Programs'],
            ['Weekly', 'Diet plans'],
            ['Live', 'Coach chat'],
          ].map(([big, small]) => (
            <div key={small}>
              <div className="accent-text" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {big}
              </div>
              <div className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {small}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer
        style={{
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.78rem',
          color: '#888',
          borderTop: '1px solid var(--border)',
        }}
      >
        © {new Date().getFullYear()} Coach Platform. All rights reserved. ·{' '}
        <Link to="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Terms of Use
        </Link>
      </footer>
    </div>
  );
}
