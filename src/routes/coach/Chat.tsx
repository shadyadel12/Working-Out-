import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getPlayerForCoach } from '../../api/players';
import ChatWindow from '../../components/ChatWindow';

export default function CoachChat() {
  const { playerId } = useParams<{ playerId: string }>();
  const { session } = useAuth();
  const coachId = session!.user.id;

  const { data: player } = useQuery({
    queryKey: ['player', coachId, playerId],
    queryFn: () => getPlayerForCoach(coachId, playerId!),
    enabled: !!playerId,
  });

  return (
    <div className="stack">
      <div>
        <Link to="/coach/dashboard" className="muted" style={{ fontSize: '0.85rem' }}>
          ← Dashboard
        </Link>
        <h1 style={{ margin: '0.2rem 0 0' }}>
          Chat — {player?.profile?.name ?? player?.profile?.email ?? '…'}
        </h1>
      </div>
      <ChatWindow coachId={coachId} playerId={playerId!} currentUserId={coachId} />
    </div>
  );
}
