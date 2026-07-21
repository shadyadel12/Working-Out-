import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

type CoachCapability = 'view' | 'chat' | 'manage' | 'sell' | 'owner';

export default function RequireCoachCapability({
  capability,
  children,
}: {
  capability: CoachCapability;
  children: ReactNode;
}) {
  const { teamMembership, coachCapabilities } = useAuth();
  const allowed = capability === 'owner'
    ? !teamMembership
    : capability === 'view'
      ? coachCapabilities.canViewPlayers
      : capability === 'chat'
        ? coachCapabilities.canChat
        : capability === 'manage'
          ? coachCapabilities.canManagePlayers
          : coachCapabilities.canSell;
  return allowed ? <>{children}</> : <Navigate to="/coach/dashboard" replace />;
}
