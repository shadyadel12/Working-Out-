import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

export function getLastRead(userId: string, type: 'chat' | 'support'): string {
  return localStorage.getItem(`lastRead_${userId}_${type}`) ?? new Date(0).toISOString();
}

export function markRead(userId: string, type: 'chat' | 'support') {
  localStorage.setItem(`lastRead_${userId}_${type}`, new Date().toISOString());
}

/** Returns { chatCount, supportCount } unread message counts for the current user. */
export function useUnreadCounts() {
  const { session, profile, effectiveCoachId, coachCapabilities } = useAuth();
  const userId = session?.user.id;
  const role = profile?.role;

  const chatQ = useQuery({
    queryKey: ['unread', 'chat', userId, effectiveCoachId],
    queryFn: async () => {
      if (!userId || !role) return 0;
      const since = getLastRead(userId, 'chat');
      if (role === 'player') {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('player_id', userId)
          .neq('sender_id', userId)
          .gt('created_at', since);
        return count ?? 0;
      }
      if (role === 'coach') {
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', effectiveCoachId!)
          .neq('sender_id', userId)
          .gt('created_at', since);
        return count ?? 0;
      }
      return 0;
    },
    enabled: !!userId && (role === 'player' || (role === 'coach' && coachCapabilities.canChat)),
    refetchInterval: 20_000,
  });

  const supportQ = useQuery({
    queryKey: ['unread', 'support', userId],
    queryFn: async () => {
      if (!userId || !role) return 0;
      const since = getLastRead(userId, 'support');
      if (role === 'coach') {
        const { count } = await supabase
          .from('admin_messages')
          .select('*', { count: 'exact', head: true })
          .eq('coach_id', userId)
          .neq('sender_id', userId)
          .gt('created_at', since);
        return count ?? 0;
      }
      if (role === 'admin') {
        const { count } = await supabase
          .from('admin_messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', userId)
          .gt('created_at', since);
        return count ?? 0;
      }
      return 0;
    },
    enabled: !!userId && (role === 'coach' || role === 'admin'),
    refetchInterval: 20_000,
  });

  return {
    chatCount: chatQ.data ?? 0,
    supportCount: supportQ.data ?? 0,
  };
}

/** Call inside any chat component to reset the unread counter for that type. */
export function useMarkReadOnMount(type: 'chat' | 'support') {
  const { session } = useAuth();
  const qc = useQueryClient();
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) return;
    markRead(userId, type);
    qc.setQueryData(['unread', type, userId], 0);
  }, [userId, type]); // eslint-disable-line react-hooks/exhaustive-deps
}
