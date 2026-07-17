import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import ChatWindow from '../../components/ChatWindow';

export default function PlayerChat() {
  const { session } = useAuth();
  const playerId = session!.user.id;

  // Find the player's active coach
  const { data: link, isLoading } = useQuery({
    queryKey: ['myCoachLink', playerId],
    queryFn: async () => {
      const { data } = await supabase
        .from('coach_player_links')
        .select('coach_id')
        .eq('player_id', playerId)
        .eq('status', 'active')
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) return <p className="muted">Loading…</p>;
  if (!link?.coach_id) return <p className="muted">No active coach assigned yet.</p>;

  return (
    <div className="stack">
      <h1>Chat with your coach</h1>
      <ChatWindow coachId={link.coach_id} playerId={playerId} currentUserId={playerId} />
    </div>
  );
}
