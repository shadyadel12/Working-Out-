import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isSubscriptionActive } from '../../api/auth';
import { listCheckupsForDate } from '../../api/checkups';
import { listCoachChatThreads } from '../../api/chat';
import { listPlayerActivitySummaries, listPlayersForCoach } from '../../api/players';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { todayISO } from '../../lib/dates';
import AppIcon from '../../components/AppIcon';

const DAY = 86_400_000;

export default function CoachDashboard() {
  const { session, profile, effectiveCoachId, coachCapabilities } = useAuth();
  const coachId = effectiveCoachId!;
  const viewerId = session!.user.id;
  const today = todayISO();
  const playersQuery = useQuery({ queryKey: ['players', coachId], queryFn: () => listPlayersForCoach(coachId) });
  const claimedIds = useMemo(() => (playersQuery.data ?? []).flatMap((player) => player.profile ? [player.profile.id] : []), [playersQuery.data]);
  const activityQuery = useQuery({
    queryKey: ['coach-dashboard-activity', coachId, claimedIds],
    queryFn: () => listPlayerActivitySummaries(claimedIds),
    enabled: claimedIds.length > 0,
  });
  const checkupsQuery = useQuery({ queryKey: ['checkups', coachId, today], queryFn: () => listCheckupsForDate(coachId, today) });
  const chatsQuery = useQuery({ queryKey: ['coach-chat-threads', coachId, viewerId], queryFn: () => listCoachChatThreads(coachId, viewerId) });

  const dashboard = useMemo(() => {
    const players = playersQuery.data ?? [];
    const activities = new Map((activityQuery.data ?? []).map((item) => [item.playerId, item.lastActivity]));
    const checkups = new Map((checkupsQuery.data ?? []).map((item) => [item.player_id, item.is_checked]));
    const threads = new Map((chatsQuery.data ?? []).map((item) => [item.player_id, item]));
    const weekday = new Date(`${today}T12:00:00`).getDay();
    const roster = players.flatMap((player) => {
      if (!player.profile) return [];
      const playerProfile = player.profile;
      const lastActivity = activities.get(playerProfile.id) ?? null;
      const inactiveDays = lastActivity ? Math.max(0, Math.floor((Date.now() - new Date(`${lastActivity}T12:00:00`).getTime()) / DAY)) : null;
      const dueCheckup = player.link.is_vip || player.link.checkup_weekdays.includes(weekday);
      return [{ ...player, profile: playerProfile, lastActivity, inactiveDays, dueCheckup, checked: checkups.get(playerProfile.id) ?? false, unread: threads.get(playerProfile.id)?.unread ?? false }];
    });
    const attention = roster.filter((player) => player.unread || (player.dueCheckup && !player.checked) || player.needsProgramming || player.inactiveDays === null || player.inactiveDays >= 7 || !isSubscriptionActive(player.link));
    attention.sort((a, b) => score(b) - score(a));
    return {
      roster,
      attention,
      active: roster.filter((player) => isSubscriptionActive(player.link)).length,
      unread: roster.filter((player) => player.unread).length,
      overdueCheckups: roster.filter((player) => player.dueCheckup && !player.checked).length,
      inactive: roster.filter((player) => player.inactiveDays === null || player.inactiveDays >= 7).length,
    };
  }, [activityQuery.data, chatsQuery.data, checkupsQuery.data, playersQuery.data, today]);

  const loading = playersQuery.isLoading || (claimedIds.length > 0 && activityQuery.isLoading);
  const error = playersQuery.error || activityQuery.error || checkupsQuery.error || chatsQuery.error;
  const firstName = profile?.name?.split(' ')[0] || 'Coach';

  return <div className="coach-overview-page">
    <section className="coach-overview-hero">
      <div><span className="overview-kicker">Coach command center</span><h1>Good day, {firstName}</h1><p>Start with the players who need you most, then keep the rest of the roster moving.</p></div>
      <div className="overview-hero-actions">{coachCapabilities.canManagePlayers && <Link className="overview-primary-action" to="/coach/checkups">Start check-ups</Link>}{coachCapabilities.canChat && <Link className="overview-secondary-action" to="/coach/messages">Open inbox</Link>}</div>
    </section>

    {loading && <LoadingSkeleton rows={5} />}
    {error && <p className="error" role="alert">{(error as Error).message}</p>}
    {!loading && !error && <>
      <section className="overview-metrics" aria-label="Coaching overview">
        <Metric label="Need attention" value={dashboard.attention.length} detail="Prioritized across your roster" tone="accent" />
        <Metric label="Unread messages" value={dashboard.unread} detail={dashboard.unread ? 'Waiting for a reply' : 'Inbox is clear'} tone="violet" />
        <Metric label="Check-ups due" value={dashboard.overdueCheckups} detail="Scheduled for today" tone="warning" />
        <Metric label="Inactive 7+ days" value={dashboard.inactive} detail={`${dashboard.active} active players`} tone="mint" />
      </section>

      <div className="overview-layout">
        <section className="attention-panel">
          <header><div><span className="overview-kicker">Priority queue</span><h2>Players needing attention</h2></div><Link to="/coach/checkups">View today’s check-ups</Link></header>
          {dashboard.attention.length === 0 ? <div className="attention-empty"><strong>You’re caught up.</strong><p>No players currently have urgent coaching signals.</p></div> : <div className="attention-list">{dashboard.attention.slice(0, 6).map((player) => {
            const name = player.profile.name ?? player.profile.email;
            return <article className="attention-row" key={player.profile.id}>
              <div className="attention-avatar" aria-hidden="true">{initials(name)}</div>
              <div className="attention-person"><strong>{name} {player.link.is_vip && <span className="badge vip">VIP</span>}</strong><small>{activityLabel(player.lastActivity, player.inactiveDays)}</small></div>
              <div className="attention-signals">{player.unread && <span className="signal unread">Unread message</span>}{player.dueCheckup && !player.checked && <span className="signal checkup">Check-up due</span>}{player.needsProgramming && <span className="signal program">Needs program</span>}{(player.inactiveDays === null || player.inactiveDays >= 7) && <span className="signal inactive">Low activity</span>}{!isSubscriptionActive(player.link) && <span className="signal expired">Subscription</span>}</div>
              <Link className="attention-action" aria-label={`Open ${name}`} to={`/coach/players/${player.profile.id}`}>Open <AppIcon name="arrow" size={15} /></Link>
            </article>;
          })}</div>}
        </section>

        <aside className="overview-sidebar">
          <section className="overview-side-card"><span className="overview-kicker">Today</span><h2>{dashboard.overdueCheckups === 0 ? 'All clear' : `${dashboard.overdueCheckups} check-ups left`}</h2><p>{dashboard.overdueCheckups === 0 ? 'Every scheduled player has been checked.' : 'Work through the scheduled list while context is fresh.'}</p><Link to="/coach/checkups">Open daily check-ups →</Link></section>
          <section className="overview-side-card"><span className="overview-kicker">Quick actions</span><nav aria-label="Quick coach actions">{coachCapabilities.canManagePlayers && <><Link to="/coach/program-library"><span><AppIcon name="program" /></span><span><strong>Build a program</strong><small>Start from a reusable plan</small></span></Link><Link to="/coach/workout-library"><span><AppIcon name="workout" /></span><span><strong>Create a workout</strong><small>Add to your library</small></span></Link></>}{coachCapabilities.canSell && <Link to="/coach/subs"><span><AppIcon name="add-player" /></span><span><strong>Invite a player</strong><small>Generate a subscription key</small></span></Link>}</nav></section>
        </aside>
      </div>
    </>}
  </div>;
}

function score(player: { unread: boolean; dueCheckup: boolean; checked: boolean; needsProgramming: boolean; inactiveDays: number | null; link: Parameters<typeof isSubscriptionActive>[0] }) {
  return Number(player.unread) * 5 + Number(player.dueCheckup && !player.checked) * 4 + Number(player.needsProgramming) * 3 + Number(player.inactiveDays === null || player.inactiveDays >= 7) * 2 + Number(!isSubscriptionActive(player.link)) * 4;
}

function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  return <article className={`overview-metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
function activityLabel(date: string | null, days: number | null) {
  if (!date || days === null) return 'No training activity yet';
  if (days === 0) return 'Trained today';
  if (days === 1) return 'Last trained yesterday';
  return `Last trained ${days} days ago`;
}
