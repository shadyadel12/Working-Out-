import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getMyProfile } from '../api/profiles';
import { getMySubscription, signOut as apiSignOut, type SubscriptionInfo } from '../api/auth';
import type { Profile, UserRole } from '../types/database.types';
import type { TeamRole } from '../api/team';

export interface TeamMembership {
  ownerCoachId: string;
  role: TeamRole;
}

export interface CoachCapabilities {
  canViewPlayers: boolean;
  canChat: boolean;
  canManagePlayers: boolean;
  canSell: boolean;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  teamMembership: TeamMembership | null;
  effectiveCoachId: string | null;
  coachCapabilities: CoachCapabilities;
  subscription: SubscriptionInfo | null; // players only
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [teamMembership, setTeamMembership] = useState<TeamMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setSubscription(null);
      setTeamMembership(null);
      return;
    }
    try {
      const p = await getMyProfile(s.user.id);
      setProfile(p);
      if (p?.role === 'player') {
        setSubscription(await getMySubscription(s.user.id));
      } else {
        setSubscription(null);
      }
      if (p?.role === 'coach') {
        const { data: membership, error: membershipError } = await supabase
          .from('coach_team_members' as never)
          .select('owner_coach_id,role')
          .eq('member_id', s.user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (membershipError) throw membershipError;
        const row = membership as { owner_coach_id: string; role: TeamRole } | null;
        setTeamMembership(row ? { ownerCoachId: row.owner_coach_id, role: row.role } : null);
      } else {
        setTeamMembership(null);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setProfile(null);
      setSubscription(null);
      setTeamMembership(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Initial session read.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadUserData(data.session);
      if (mounted) setLoading(false);
    });

    // Subscribe to future auth changes (login/logout/token refresh).
    const {
      data: { subscription: sub },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s);
      await loadUserData(s);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.unsubscribe();
    };
  }, [loadUserData]);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setSession(null);
    setProfile(null);
    setSubscription(null);
    setTeamMembership(null);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (session?.user.id && profile?.role === 'player') {
      setSubscription(await getMySubscription(session.user.id));
    }
  }, [session, profile]);

  const effectiveCoachId = profile?.role === 'coach'
    ? (teamMembership?.ownerCoachId ?? session?.user.id ?? null)
    : null;
  const teamRole = teamMembership?.role;
  const coachCapabilities: CoachCapabilities = profile?.role !== 'coach'
    ? { canViewPlayers: false, canChat: false, canManagePlayers: false, canSell: false }
    : !teamRole
      ? { canViewPlayers: true, canChat: true, canManagePlayers: true, canSell: true }
      : {
          canViewPlayers: true,
          canChat: teamRole === 'chat' || teamRole === 'head_coach',
          canManagePlayers: teamRole === 'head_coach',
          canSell: teamRole === 'sales',
        };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        role: profile?.role ?? null,
        teamMembership,
        effectiveCoachId,
        coachCapabilities,
        subscription,
        loading,
        signOut,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
