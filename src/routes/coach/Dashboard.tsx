import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { listPlayersForCoach, type PlayerWithLink } from '../../api/players';
import { isSubscriptionActive } from '../../api/auth';
import LoadingSkeleton from '../../components/LoadingSkeleton';

export default function CoachDashboard() {
  const { session } = useAuth();
  const coachId = session!.user.id;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [renew, setRenew] = useState('all');
  const { data, isLoading, error } = useQuery({ queryKey: ['players', coachId], queryFn: () => listPlayersForCoach(coachId) });

  const players = useMemo(() => (data ?? []).filter((player) => {
    const term = search.trim().toLowerCase();
    const searchable = `${player.profile?.name ?? ''} ${player.profile?.email ?? ''} ${player.link.subscription_key}`.toLowerCase();
    const active = isSubscriptionActive(player.link);
    if (term && !searchable.includes(term)) return false;
    if (status === 'active' && !active) return false;
    if (status === 'expired' && active) return false;
    if (status === 'pending' && player.profile) return false;
    if (renew !== 'all') {
      const days = Math.ceil((new Date(`${player.link.subscription_end_date}T23:59:59`).getTime() - Date.now()) / 86400000);
      if (renew === '7' && (days < 0 || days > 7)) return false;
      if (renew === '30' && (days < 0 || days > 30)) return false;
      if (renew === 'overdue' && days >= 0) return false;
    }
    return true;
  }), [data, renew, search, status]);

  return <div className="coach-clients-page">
    <div className="coach-page-heading"><div><h1>Clients</h1><p>Manage your players and open their coaching tools.</p></div></div>
    <div className="client-filters" aria-label="Client filters">
      <select aria-label="Renew date" value={renew} onChange={(event) => setRenew(event.target.value)}><option value="all">Renew Date</option><option value="7">Next 7 days</option><option value="30">Next 30 days</option><option value="overdue">Overdue</option></select>
      <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Status</option><option value="active">Active</option><option value="expired">Expired</option><option value="pending">Pending</option></select>
    </div>
    {isLoading && <LoadingSkeleton rows={5} />}
    {error && <p className="error">{(error as Error).message}</p>}
    {data?.length === 0 && <div className="card"><p className="muted">No players yet. Create a subscription key in Settings — once a player signs up with it, they will appear here.</p></div>}
    {data && data.length > 0 && <div className="clients-table-card">
      <div className="clients-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clients" aria-label="Search clients" /></div>
      <div className="clients-table-scroll"><table className="clients-table"><thead><tr><th>Name</th><th>Subscription key</th><th>Renew date</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{players.map((player) => <PlayerRow key={player.link.id} player={player} />)}</tbody></table></div>
      {players.length === 0 && <div className="clients-empty">No clients match these filters.</div>}
      <div className="clients-table-footer">Showing {players.length} of {data.length} clients</div>
    </div>}
  </div>;
}

function PlayerRow({ player }: { player: PlayerWithLink }) {
  const active = isSubscriptionActive(player.link);
  const claimed = player.profile !== null;
  const displayName = player.profile?.name ?? player.profile?.email ?? 'Unclaimed key';
  return <tr>
    <td><strong>{displayName}</strong>{player.profile && <small>{player.profile.email}</small>}</td>
    <td><span className="client-key">{player.link.subscription_key}</span></td>
    <td>{player.link.subscription_end_date}</td>
    <td><span className={`badge ${claimed ? (active ? 'active' : 'expired') : 'pending'}`}>{claimed ? (active ? 'Active' : 'Expired') : 'Pending'}</span></td>
    <td className="client-actions">{claimed && player.profile ? <details><summary aria-label={`Open actions for ${displayName}`}>⋮</summary><div className="client-action-menu">
      <Link to={`/coach/players/${player.profile.id}/program`}>Program</Link><Link to={`/coach/players/${player.profile.id}/diet`}>Diet</Link><Link to={`/coach/players/${player.profile.id}/analysis`}>Analysis</Link><Link to={`/coach/players/${player.profile.id}/diet-progress`}>Diet Progress</Link><Link to={`/coach/players/${player.profile.id}/chat`}>Chat</Link><Link to={`/coach/players/${player.profile.id}/messages`}>Messages</Link>
    </div></details> : <span className="muted">Not claimed</span>}</td>
  </tr>;
}
