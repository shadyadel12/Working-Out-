import { useParams } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getPlayerForCoach } from '../../api/players';
import { markCoachThreadRead } from '../../api/chat';
import { useEffect } from 'react';
import ChatWindow from '../../components/ChatWindow';

export default function CoachChat() {
  const { playerId } = useParams<{ playerId: string }>();
  const { session } = useAuth();
  const coachId = session!.user.id;
  useEffect(() => { if (playerId) markCoachThreadRead(coachId, playerId); }, [coachId, playerId]);

  const { data: player } = useQuery({
    queryKey: ['player', coachId, playerId],
    queryFn: () => getPlayerForCoach(coachId, playerId!),
    enabled: !!playerId,
  });

  return (
    <div className="stack">
      <div>
        <BackButton />
        <h1 style={{ margin: '0.2rem 0 0' }}>
          Chat — {player?.profile?.name ?? player?.profile?.email ?? '…'}
        </h1>
      </div>
      <ChatWindow coachId={coachId} playerId={playerId!} currentUserId={coachId} />
    </div>
  );
}
