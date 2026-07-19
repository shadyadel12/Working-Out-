import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import AppIcon, { type AppIconName } from '../components/AppIcon';

type NavLink_ = { to: string; label: string; badgeKey?: 'chat' | 'support'; group?: 'library' };

export default function AppLayout({ links }: { links: NavLink_[] }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatCount, supportCount } = useUnreadCounts();
  const isCoach = profile?.role === 'coach';
  const libraryActive = links.some((link) => link.group === 'library' && location.pathname.startsWith(link.to));
  const [libraryOpen, setLibraryOpen] = useState(libraryActive);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });
  useEffect(() => { if (libraryActive) setLibraryOpen(true); }, [libraryActive]);
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('app_theme', theme); }, [theme]);
  const countFor = (key?: 'chat' | 'support') => key === 'chat' ? chatCount : key === 'support' ? supportCount : 0;
  async function handleSignOut() { await signOut(); navigate('/', { replace: true }); }
  const themeToggle = <button type="button" className="secondary theme-toggle" aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'} title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'} onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}><span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span><span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button>;
  const libraryLinks = links.filter((link) => link.group === 'library');
  const regularLinks = links.filter((link) => !link.group);
  const pageTheme = location.pathname.split('/').filter(Boolean).pop()?.replace(/[^a-z-]/g, '') || 'home';

  function navLink(link: NavLink_, nested = false) {
    const count = countFor(link.badgeKey);
    const label = isCoach && link.label === 'Dashboard' ? 'Clients' : link.label;
    return <NavLink key={link.to} to={link.to} className={({ isActive }) => `${isActive ? 'active' : ''}${nested ? ' library-child' : ''}`}>
      {isCoach && !nested && <span className="coach-nav-icon"><AppIcon name={iconFor(label)} size={16} /></span>}<span>{label}</span>
      {count > 0 && <span className="nav-count">{count > 99 ? '99+' : count}</span>}
    </NavLink>;
  }

  const navigation = <nav>
    {regularLinks.slice(0, 1).map((link) => navLink(link))}
    {isCoach && libraryLinks.length > 0 && <div className={`library-nav-group ${libraryOpen ? 'open' : ''}`}>
      <button type="button" className={libraryActive ? 'active' : ''} onClick={() => setLibraryOpen((value) => !value)} aria-expanded={libraryOpen}>
        <span className="coach-nav-icon"><AppIcon name="library" size={16} /></span><span>Library</span><span className="library-chevron">⌄</span>
      </button>
      {libraryOpen && <div className="library-nav-children">{libraryLinks.map((link) => navLink(link, true))}</div>}
    </div>}
    {regularLinks.slice(1).map((link) => navLink(link))}
  </nav>;

  return <div className={`${isCoach ? 'app-shell coach-shell coach-top-shell' : 'app-shell player-top-shell'} route-background route-${pageTheme}`}>
    {isCoach && <header className="coach-topnav"><div className="coach-brand"><span className="coach-brand-mark"><AppIcon name="pulse" size={19} /></span><span>PULSE<strong>FIT</strong></span></div><div className="coach-nav">{navigation}</div><div className="coach-top-account"><span>{profile?.name ?? profile?.email}</span>{themeToggle}<button className="secondary" onClick={handleSignOut}>Sign out</button></div></header>}
    <div className="app-content"><header className="topbar"><div className="row"><strong>{isCoach ? 'Coach workspace' : 'PULSEFIT'}</strong>{!isCoach && navigation}</div><div className="row"><span className="muted topbar-user">{profile?.name ?? profile?.email}</span>{!isCoach && themeToggle}<button className="secondary" onClick={handleSignOut}>Sign out</button></div></header><main className="container"><Outlet /></main><footer>© {new Date().getFullYear()} Coach Platform. All rights reserved. · <a href="/terms">Terms of Use</a></footer></div>
  </div>;
}

function iconFor(label: string): AppIconName {
  const icons: Record<string, AppIconName> = { Clients: 'dashboard', 'Check-ups': 'checkup', Messages: 'messages', Team: 'team', Subs: 'subscription', Settings: 'settings', Support: 'support' };
  return icons[label] ?? 'dashboard';
}
