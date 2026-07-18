import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'coach' | 'player';
type Profile = { id: string; role: UserRole; email: string; name: string | null };
type AuthValue = { session: Session | null; profile: Profile | null; loading: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  async function load(next: Session | null) {
    setSession(next);
    if (!next) setProfile(null);
    else {
      const { data, error } = await supabase.from('profiles').select('id,role,email,name').eq('id', next.user.id).single();
      if (error) throw error;
      setProfile(data as Profile);
    }
    setLoading(false);
  }
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session)).catch(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { void load(next); });
    return () => data.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={{ session, profile, loading, signOut: async () => { await supabase.auth.signOut(); } }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be inside AuthProvider'); return value; }
