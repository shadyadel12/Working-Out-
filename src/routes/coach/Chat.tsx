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
  const { session, effectiveCoachId, coachCapabilities } = useAuth();
  const coachId = effectiveCoachId!;
  useEffect(() => { if (playerId && coachCapabilities.canChat) markCoachThreadRead(session!.user.id, playerId); }, [coachCapabilities.canChat, playerId, session]);

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
      {coachCapabilities.canChat
        ? <ChatWindow coachId={coachId} playerId={playerId!} currentUserId={session!.user.id} />
        : <div className="card"><p>You do not have permission to use player chat.</p></div>}
    </div>
  );
}
