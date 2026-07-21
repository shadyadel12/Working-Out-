import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { listCoachChatThreads } from '../../api/chat';
import { listPlayersForCoach } from '../../api/players';

export default function ChatInbox() {
  const { effectiveCoachId, coachCapabilities } = useAuth();
  const coachId = effectiveCoachId!;
  const players = useQuery({ queryKey: ['players', coachId], queryFn: () => listPlayersForCoach(coachId) });
  const threads = useQuery({ queryKey: ['coach-chat-threads', coachId], queryFn: () => listCoachChatThreads(coachId), refetchInterval: 15000 });
  const byId = new Map((players.data ?? []).filter((player) => player.profile).map((player) => [player.profile!.id, player]));
  const rows = (threads.data ?? []).map((thread) => ({ thread, player: byId.get(thread.player_id) })).filter((row) => row.player).sort((a, b) => {
    const aVipUnread = a.player!.link.is_vip && a.thread.unread;
    const bVipUnread = b.player!.link.is_vip && b.thread.unread;
    if (aVipUnread !== bVipUnread) return Number(bVipUnread) - Number(aVipUnread);
    if (a.thread.unread !== b.thread.unread) return Number(b.thread.unread) - Number(a.thread.unread);
    return b.thread.latest_at.localeCompare(a.thread.latest_at);
  });
  if (!coachCapabilities.canChat) return <div className="card"><p>You do not have permission to use player chat.</p></div>;
  return <div className="chat-inbox-page stack"><div><h1>Messages</h1><p className="muted">VIP unread messages stay at the top, followed by other unread conversations.</p></div><div className="card chat-inbox-list">{rows.length === 0 && <p className="muted">No player conversations yet.</p>}{rows.map(({ thread, player }) => <Link className={`chat-inbox-row ${thread.unread ? 'unread' : ''}`} to={`/coach/players/${thread.player_id}/chat`} key={thread.player_id}><div className="chat-inbox-avatar">{(player!.profile!.name ?? player!.profile!.email).slice(0, 2).toUpperCase()}</div><div><strong>{player!.profile!.name ?? player!.profile!.email} {player!.link.is_vip && <span className="badge vip">VIP</span>}</strong><p>{thread.latest_body}</p></div><div><time>{new Date(thread.latest_at).toLocaleString()}</time>{thread.unread && <span className="unread-dot" />}</div></Link>)}</div></div>;
}
