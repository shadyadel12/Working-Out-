import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type UserRole = "admin" | "coach" | "player";
export type TeamRole = "viewer" | "chat" | "head_coach" | "sales";
type Profile = {
  id: string;
  role: UserRole;
  email: string;
  name: string | null;
};
type TeamMembership = { ownerCoachId: string; role: TeamRole };
type AuthValue = {
  session: Session | null;
  profile: Profile | null;
  teamMembership: TeamMembership | null;
  effectiveCoachId: string | null;
  loading: boolean;
  aal2: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [aal2, setAal2] = useState(false);
  const [teamMembership, setTeamMembership] = useState<TeamMembership | null>(
    null,
  );
  async function load(next: Session | null) {
    setSession(next);
    if (!next) {
      setProfile(null);
      setAal2(false);
      setTeamMembership(null);
    } else {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,role,email,name")
        .eq("id", next.user.id)
        .single();
      if (error) throw error;
      setProfile(data as Profile);
      if (data.role === "coach") {
        const { data: member } = await supabase
          .from("coach_team_members" as never)
          .select("owner_coach_id,role")
          .eq("member_id", next.user.id)
          .eq("status", "active")
          .maybeSingle();
        const row = member as { owner_coach_id: string; role: TeamRole } | null;
        setTeamMembership(
          row ? { ownerCoachId: row.owner_coach_id, role: row.role } : null,
        );
      } else setTeamMembership(null);
      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setAal2(assurance?.currentLevel === "aal2");
    }
    setLoading(false);
  }
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => load(data.session))
      .catch(() => setLoading(false));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      void load(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    await load(data.session);
  };
  const effectiveCoachId =
    profile?.role === "coach"
      ? (teamMembership?.ownerCoachId ?? session?.user.id ?? null)
      : null;
  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        teamMembership,
        effectiveCoachId,
        loading,
        aal2,
        refresh,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be inside AuthProvider");
  return value;
}
