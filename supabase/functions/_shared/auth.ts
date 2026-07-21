export type AuthenticatorAssuranceLevel = 'aal1' | 'aal2' | null;

/** Read the AAL claim only after Supabase Auth has verified this same bearer token. */
export function verifiedJwtAal(authHeader: string): AuthenticatorAssuranceLevel {
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const claims = JSON.parse(atob(padded)) as { aal?: unknown };
    return claims.aal === 'aal1' || claims.aal === 'aal2' ? claims.aal : null;
  } catch {
    return null;
  }
}
