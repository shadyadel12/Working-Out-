import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkoutCompletion } from '../api/logs';
import { supabase } from '../lib/supabase';

export function useWorkoutCompletion(workoutId: string, playerId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['workout-completion', workoutId, playerId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => getWorkoutCompletion(workoutId, playerId),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const channel = supabase.channel(`workout-completion-${workoutId}-${playerId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'exercise_logs', filter: `player_id=eq.${playerId}`,
      }, () => { void queryClient.invalidateQueries({ queryKey }); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [playerId, queryClient, workoutId]);

  return query;
}
