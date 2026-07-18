import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useUnreadCounts } from '../hooks/useUnreadCounts';

type NavLink_ = { to: string; label: string; badgeKey?: 'chat' | 'support' };

export default function AppLayout({ links }: { links: NavLink_[] }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { chatCount, supportCount } = useUnreadCounts();
  const isCoach = profile?.role === 'coach';
  const countFor = (key?: 'chat' | 'support') => key === 'chat' ? chatCount : key === 'support' ? supportCount : 0;
  async function handleSignOut() { await signOut(); navigate('/', { replace: true }); }

  const navigation = <nav>{links.map((link) => {
    const count = countFor(link.badgeKey);
    const label = isCoach && link.label === 'Dashboard' ? 'Clients' : link.label;
    return <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? 'active' : ''}>
      {isCoach && <span className="coach-nav-icon" aria-hidden="true">{label.slice(0, 1)}</span>}<span>{label}</span>
      {count > 0 && <span className="nav-count">{count > 99 ? '99+' : count}</span>}
    </NavLink>;
  })}</nav>;

  return <div className={isCoach ? 'app-shell coach-shell' : 'app-shell'}>
    {isCoach && <aside className="coach-sidebar"><div className="coach-brand"><span className="coach-brand-mark">K</span><span>COACH</span></div><div className="coach-nav">{navigation}</div><div className="coach-sidebar-profile" title={profile?.name ?? profile?.email}>{(profile?.name ?? profile?.email ?? 'C').slice(0, 2).toUpperCase()}</div></aside>}
    <div className="app-content">
      <header className="topbar"><div className="row"><strong>{isCoach ? 'Coach workspace' : 'Coach Platform'}</strong>{!isCoach && navigation}</div><div className="row"><span className="muted topbar-user">{profile?.name ?? profile?.email}</span><button className="secondary" onClick={handleSignOut}>Sign out</button></div></header>
      <main className="container"><Outlet /></main>
      <footer>© {new Date().getFullYear()} Coach Platform. All rights reserved. · <a href="/terms">Terms of Use</a></footer>
    </div>
  </div>;
}
