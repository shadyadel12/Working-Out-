import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useUnreadCounts } from '../hooks/useUnreadCounts';

type NavLink_ = { to: string; label: string; badgeKey?: 'chat' | 'support' };

export default function AppLayout({ links }: { links: NavLink_[] }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { chatCount, supportCount } = useUnreadCounts();

  const countFor = (key?: 'chat' | 'support') => {
    if (key === 'chat') return chatCount;
    if (key === 'support') return supportCount;
    return 0;
  };

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="topbar">
        <div className="row" style={{ gap: '1.5rem' }}>
          <strong>Coach Platform</strong>
          <nav>
            {links.map((l) => {
              const count = countFor(l.badgeKey);
              return (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                  {l.label}
                  {count > 0 && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 18,
                        height: 18,
                        padding: '0 5px',
                        borderRadius: 9,
                        background: 'var(--accent)',
                        color: 'var(--accent-text)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        marginLeft: 6,
                        verticalAlign: 'middle',
                        lineHeight: 1,
                      }}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
        <div className="row">
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            {profile?.name ?? profile?.email}
          </span>
          <button className="secondary" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="container" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '1rem',
        fontSize: '0.78rem',
        color: 'var(--text-muted, #888)',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
      }}>
        © {new Date().getFullYear()} Coach Platform. All rights reserved. · Unauthorized reproduction or redistribution is prohibited.{' '}
        <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Use</a>
      </footer>
    </div>
  );
}
