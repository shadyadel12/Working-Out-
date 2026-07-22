import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useUnreadCounts } from '../hooks/useUnreadCounts';
import { useLanguage } from '../i18n/LanguageProvider';
import { Activity, Apple, BarChart3, BookOpen, Box, CalendarCheck2, CheckSquare, ChevronDown, ClipboardCheck, CreditCard, Dumbbell, FileText, FolderKanban, KeyRound, LayoutDashboard, LibraryBig, LifeBuoy, ListChecks, LogOut, Menu, MessageCircle, Moon, NotebookTabs, Salad, Settings, Sun, UserRound, UsersRound, Utensils, X, type LucideIcon } from 'lucide-react';

type NavLink_ = { to: string; label: string; badgeKey?: 'chat' | 'support'; group?: 'library' };

export default function AppLayout({ links }: { links: NavLink_[] }) {
  const { profile, signOut, teamMembership } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatCount, supportCount } = useUnreadCounts();
  const { theme, setTheme } = useLanguage();
  const isCoach = profile?.role === 'coach';
  const visibleLinks = !teamMembership ? links : links.filter((link) => {
    if (link.label === 'Dashboard' || link.label === 'Settings' || link.label === 'Support' || link.label === 'How It Works') return true;
    if (link.group === 'library') return false;
    if (link.label === 'Messages') return teamMembership.role === 'chat' || teamMembership.role === 'head_coach';
    if (link.label === 'Check-ups') return teamMembership.role !== 'sales';
    if (link.label === 'Subs') return teamMembership.role === 'sales';
    return false;
  });
  const libraryActive = visibleLinks.some((link) => link.group === 'library' && location.pathname.startsWith(link.to));
  const [libraryOpen, setLibraryOpen] = useState(libraryActive);
  useEffect(() => { if (libraryActive) setLibraryOpen(true); }, [libraryActive]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);
  const countFor = (key?: 'chat' | 'support') => key === 'chat' ? chatCount : key === 'support' ? supportCount : 0;
  async function handleSignOut() { await signOut(); navigate('/', { replace: true }); }
  const themeToggle = <button type="button" className="secondary theme-toggle" aria-label={theme === 'dark' ? 'Use light mode' : 'Use dark mode'} title={theme === 'dark' ? 'Use light mode' : 'Use dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>;
  const libraryLinks = visibleLinks.filter((link) => link.group === 'library');
  const regularLinks = visibleLinks.filter((link) => !link.group);
  const utilityLabels = new Set(['Team', 'Subs', 'Settings', 'Support']);
  const utilityLinks = isCoach ? regularLinks.filter((link) => utilityLabels.has(link.label)) : [];
  const primaryLinks = isCoach ? regularLinks.filter((link) => !utilityLabels.has(link.label)) : regularLinks;
  const pageTheme = location.pathname.split('/').filter(Boolean).pop()?.replace(/[^a-z-]/g, '') || 'home';

  function navLink(link: NavLink_, nested = false) {
    const count = countFor(link.badgeKey);
    const label = isCoach && link.label === 'Dashboard' ? 'Clients' : link.label;
    const Icon = iconFor(label);
    return <NavLink key={link.to} to={link.to} aria-label={label} title={label} onClick={() => setMobileNavOpen(false)} className={({ isActive }) => `adaptive-nav-item${isActive ? ' active' : ''}${nested ? ' library-child' : ''}`}>
      <span className="coach-nav-icon"><Icon size={18} strokeWidth={1.9} /></span><span className="adaptive-nav-label">{label}</span>
      {count > 0 && <span className="nav-count">{count > 99 ? '99+' : count}</span>}
    </NavLink>;
  }

  const navigation = <nav className="adaptive-nav">
    {primaryLinks.slice(0, 1).map((link) => navLink(link))}
    {isCoach && libraryLinks.length > 0 && <div className={`library-nav-group ${libraryOpen ? 'open' : ''}`}>
      <button type="button" className={libraryActive ? 'active' : ''} onClick={() => setLibraryOpen((value) => !value)} aria-expanded={libraryOpen}>
        <span className="coach-nav-icon"><LibraryBig size={18} strokeWidth={1.9} /></span><span className="adaptive-nav-label">Library</span><ChevronDown className="library-chevron" size={15} />
      </button>
      {libraryOpen && <div className="library-nav-children">{libraryLinks.map((link) => navLink(link, true))}</div>}
    </div>}
    {primaryLinks.slice(1).map((link) => navLink(link))}
  </nav>;

  const coachProfileMenu = <details className="coach-profile-menu">
    <summary aria-label="Open coach profile menu"><span className="coach-profile-avatar">{(profile?.name || profile?.email || 'C').slice(0, 2).toUpperCase()}</span></summary>
    <div className="coach-profile-popover">
      <header><span className="coach-profile-avatar large">{(profile?.name || profile?.email || 'C').slice(0, 2).toUpperCase()}</span><span><strong>{profile?.name || 'Coach'}</strong><small>{profile?.email}{teamMembership ? ` · ${teamMembership.role.replace('_', ' ')}` : ''}</small></span></header>
      <nav>{utilityLinks.map((link) => { const Icon = iconFor(link.label); return <NavLink key={link.to} to={link.to}><span className="coach-profile-action-icon"><Icon size={16} /></span><span>{link.label}</span>{countFor(link.badgeKey) > 0 && <span className="nav-count">{countFor(link.badgeKey) > 99 ? '99+' : countFor(link.badgeKey)}</span>}</NavLink>; })}</nav>
      <button type="button" className="coach-profile-signout" onClick={handleSignOut}><LogOut size={17} /><span>Sign out</span></button>
    </div>
  </details>;

  const menuButton = <button
    type="button"
    className="secondary mobile-nav-toggle"
    aria-expanded={mobileNavOpen}
    aria-controls="signed-in-navigation"
    aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
    onClick={() => setMobileNavOpen((open) => !open)}
  >{mobileNavOpen ? <X size={19} /> : <Menu size={19} />}<span>Menu</span></button>;

  return <div className={`${isCoach ? 'app-shell coach-shell coach-top-shell' : 'app-shell player-top-shell'} route-background route-${pageTheme}`}>
    {isCoach && <header className="coach-topnav">
      <div className="coach-brand" aria-label="Trainova"><span className="trainova-mark"><img src="/trainova-wordmark.jpeg" alt="" /></span><strong>TRAINOVA</strong></div>
      {menuButton}
      <div id="signed-in-navigation" className={`coach-nav mobile-nav-panel ${mobileNavOpen ? 'open' : ''}`}>{navigation}</div>
      <div className="coach-top-account">{coachProfileMenu}{themeToggle}</div>
    </header>}
    <div className="app-content">
      <header className="topbar">
        <div className="signed-in-heading"><strong>{isCoach ? 'Coach workspace' : 'TRAINOVA'}</strong>{!isCoach && menuButton}</div>
        {!isCoach && <div id="signed-in-navigation" className={`player-navigation mobile-nav-panel ${mobileNavOpen ? 'open' : ''}`}>{navigation}</div>}
        <div className="topbar-account"><span className="muted topbar-user">{profile?.name ?? profile?.email}</span>{!isCoach && themeToggle}<button className="secondary" onClick={handleSignOut}><LogOut size={17} /><span>Sign out</span></button></div>
      </header>
      <main className="container"><Outlet /></main>
      <footer>© {new Date().getFullYear()} Trainova. All rights reserved. · <a href="/terms">Terms of Use</a></footer>
    </div>
  </div>;
}

function iconFor(label: string): LucideIcon {
  const icons: Record<string, LucideIcon> = {
    Clients: UsersRound, Dashboard: LayoutDashboard, Exercises: Dumbbell, Workouts: ClipboardCheck,
    Sections: FolderKanban, Programs: CalendarCheck2, Tasks: ListChecks, Forms: FileText,
    'Meal Plans': Salad, Recipes: Utensils, Ingredients: Apple, 'Recipe Books': BookOpen,
    'Metric Groups': BarChart3, 'Check-ups': CheckSquare, Messages: MessageCircle, Team: UsersRound,
    Subs: CreditCard, Settings, Support: LifeBuoy, Program: Dumbbell, Diet: Utensils,
    Progress: BarChart3, 'Diet Progress': Salad, Chat: MessageCircle, 'My Profile': UserRound,
    'Users & Keys': KeyRound,
    Traffic: Activity,
    'How It Works': Box,
  };
  return icons[label] ?? NotebookTabs;
}
