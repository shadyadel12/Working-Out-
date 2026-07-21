import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { getPlayerForCoach } from '../../api/players';
import AnalysisView from '../../components/AnalysisView';
import BackButton from '../../components/BackButton';

/** Coach's view of a linked player's performance history. */
export default function PlayerAnalysis() {
  const { playerId } = useParams<{ playerId: string }>();
  const { effectiveCoachId } = useAuth();
  const coachId = effectiveCoachId!;

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
          Analysis — {player?.profile?.name ?? player?.profile?.email ?? '…'}
        </h1>
      </div>
      {playerId && <AnalysisView playerId={playerId} coachView />}
    </div>
  );
}
