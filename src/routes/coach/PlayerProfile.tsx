import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isSubscriptionActive } from '../../api/auth';
import { getLastActivity, getPlayerForCoach } from '../../api/players';
import { getProgressPage } from '../../api/analysis';
import { listDietLogs } from '../../api/dietProgress';
import { listProgramDays } from '../../api/programs';
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const { session } = useAuth();
  const coachId = session!.user.id;
  const playerQuery = useQuery({ queryKey: ['player', coachId, playerId], queryFn: () => getPlayerForCoach(coachId, playerId!), enabled: !!playerId });
  const progressQuery = useQuery({ queryKey: ['profile-progress-summary', playerId], queryFn: () => getProgressPage({ playerId: playerId!, range: 'all', page: 0, pageSize: 1 }), enabled: !!playerId });
  const dietQuery = useQuery({ queryKey: ['diet-logs', playerId], queryFn: () => listDietLogs(playerId!), enabled: !!playerId });
  const programQuery = useQuery({ queryKey: ['program', playerId], queryFn: () => listProgramDays(playerId!), enabled: !!playerId });
  const activityQuery = useQuery({ queryKey: ['last-activity', playerId], queryFn: () => getLastActivity(playerId!), enabled: !!playerId });

  if (playerQuery.isLoading) return <LoadingSkeleton rows={5} />;
  if (playerQuery.error) return <p className="error">{(playerQuery.error as Error).message}</p>;
  const player = playerQuery.data;
  if (!player?.profile || !playerId) return <div className="card"><p>Player not found.</p><Link to="/coach/dashboard">Return to clients</Link></div>;

  const active = isSubscriptionActive(player.link);
  const name = player.profile.name ?? player.profile.email;
  const initials = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const progress = progressQuery.data;
  const completion = progress?.totalLogged ? Math.round((progress.totalCompleted / progress.totalLogged) * 100) : 0;
  const dietLogs = dietQuery.data ?? [];
  const mealsDone = dietLogs.reduce((total, log) => total + log.completed_meals, 0);
  const mealsPlanned = dietLogs.reduce((total, log) => total + log.total_meals, 0);
  const dietRate = mealsPlanned ? Math.round((mealsDone / mealsPlanned) * 100) : 0;
  const trainingDays = (programQuery.data ?? []).filter((day) => day.day_type === 'training').length;

  return <div className="client-workspace">
    <header className="client-workspace-top">
      <Link to="/coach/dashboard" className="client-mini-avatar">{initials}</Link>
      <div><h1>{name}</h1><p>{player.profile.email}</p></div>
      <nav className="client-profile-tabs" aria-label="Player sections">
        <Link className="active" to={`/coach/players/${playerId}`}>Summary</Link>
        <Link to={`/coach/players/${playerId}/program`}>Training</Link>
        <Link to={`/coach/players/${playerId}/analysis`}>Analysis</Link>
        <Link to={`/coach/players/${playerId}/diet-progress`}>Diet Analysis</Link>
      </nav>
      <span className={`badge ${active ? 'active' : 'expired'}`}>{active ? 'Active' : 'Expired'}</span>
    </header>

    <div className="client-summary-grid">
      <section className="client-summary-card client-identity-card">
        <div className="client-large-avatar">{initials}</div><h2>{name}</h2><p>{player.profile.email}</p>
        <dl><div><dt>Member since</dt><dd>{new Date(player.profile.created_at).toLocaleDateString()}</dd></div><div><dt>Last workout</dt><dd>{activityQuery.data ?? 'No activity yet'}</dd></div><div><dt>Renew date</dt><dd>{player.link.subscription_end_date}</dd></div><div><dt>Subscription key</dt><dd>{player.link.subscription_key}</dd></div></dl>
      </section>
      <section className="client-summary-card client-metric-card"><span>Workout Completion</span><strong>{completion}<small>%</small></strong><p>{progress?.totalCompleted ?? 0} completed of {progress?.totalLogged ?? 0} logged exercises</p><Link to={`/coach/players/${playerId}/analysis`}>Open workout analysis →</Link></section>
      <section className="client-summary-card client-metric-card"><span>Diet Adherence</span><strong>{dietRate}<small>%</small></strong><p>{mealsDone} of {mealsPlanned} planned meals completed</p><Link to={`/coach/players/${playerId}/diet-progress`}>Open diet analysis →</Link></section>
      <section className="client-summary-card client-plan-card"><div><span>Training Plan</span><strong>{trainingDays}</strong><small>training days currently planned</small></div><Link to={`/coach/players/${playerId}/program`}>Manage Training</Link></section>
      <section className="client-summary-card client-plan-card"><div><span>Diet Plan</span><strong>{dietLogs.length}</strong><small>diet check-ins recorded</small></div><Link to={`/coach/players/${playerId}/diet`}>Manage Diet</Link></section>
      <section className="client-summary-card client-communication-card"><h2>Communication</h2><p>Chat privately or send targeted coaching guidance.</p><div><Link to={`/coach/players/${playerId}/chat`}>Open Chat</Link><Link to={`/coach/players/${playerId}/messages`}>Coach Messages</Link></div></section>
    </div>
  </div>;
}
