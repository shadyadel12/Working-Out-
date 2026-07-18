import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { isSubscriptionActive } from '../../api/auth';
import { getPlayerForCoach } from '../../api/players';
import LoadingSkeleton from '../../components/LoadingSkeleton';

const options = [
  { path: 'program', title: 'Program', description: 'Build and manage this player’s workouts.', icon: 'P' },
  { path: 'diet', title: 'Diet', description: 'Create and update the player’s diet plan.', icon: 'D' },
  { path: 'analysis', title: 'Analysis', description: 'Review workout performance and progress.', icon: 'A' },
  { path: 'diet-progress', title: 'Diet Progress', description: 'Review meal adherence and diet notes.', icon: 'DP' },
  { path: 'chat', title: 'Chat', description: 'Open the private player conversation.', icon: 'C' },
  { path: 'messages', title: 'Messages', description: 'Send coaching guidance and exercise notes.', icon: 'M' },
];

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const { session } = useAuth();
  const coachId = session!.user.id;
  const { data: player, isLoading, error } = useQuery({
    queryKey: ['player', coachId, playerId],
    queryFn: () => getPlayerForCoach(coachId, playerId!),
    enabled: !!playerId,
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error) return <p className="error">{(error as Error).message}</p>;
  if (!player?.profile || !playerId) return <div className="card"><p>Player not found.</p><Link to="/coach/dashboard">Return to clients</Link></div>;

  const active = isSubscriptionActive(player.link);
  const name = player.profile.name ?? player.profile.email;
  return <div className="player-profile-page">
    <Link to="/coach/dashboard" className="profile-back">← Clients</Link>
    <section className="player-profile-header">
      <div className="player-avatar">{name.slice(0, 2).toUpperCase()}</div>
      <div><h1>{name}</h1><p>{player.profile.email}</p></div>
      <span className={`badge ${active ? 'active' : 'expired'}`}>{active ? 'Active' : 'Expired'}</span>
    </section>
    <section className="player-subscription-summary">
      <div><span>Subscription key</span><strong>{player.link.subscription_key}</strong></div>
      <div><span>Renew date</span><strong>{player.link.subscription_end_date}</strong></div>
    </section>
    <div className="player-option-grid">{options.map((option) => <Link key={option.path} to={`/coach/players/${playerId}/${option.path}`} className="player-option-card">
      <span className="player-option-icon">{option.icon}</span><div><h2>{option.title}</h2><p>{option.description}</p></div><span className="player-option-arrow">›</span>
    </Link>)}</div>
  </div>;
}
