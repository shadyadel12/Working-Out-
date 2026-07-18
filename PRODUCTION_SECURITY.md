# Production Security Setup

The repository now contains the application-side controls. Complete the hosted
Supabase settings below before considering production hardened. Backup/restore
work is intentionally deferred.

## 1. Administrator MFA

- Deploy migration `0026_require_admin_mfa.sql` after migrations `0022`–`0025`.
- In Supabase Dashboard, enable TOTP MFA under Authentication → Multi-Factor.
- Admins will be prompted to enroll or verify an authenticator code after login.
- Migration `0026` denies admin RLS and RPC access unless the JWT has `aal2`.

## 2. Password policy

In Authentication → Security / Password Security, mirror `supabase/config.toml`:

- Minimum length: 10 characters.
- Require lowercase, uppercase, digits, and symbols.
- Enable leaked-password protection if available on the selected Supabase plan.

## 3. Abuse and rate controls

In Authentication → Rate Limits, mirror the values under `[auth.rate_limit]` in
`supabase/config.toml`. Enable CAPTCHA for sign-up and sign-in using a production
hCaptcha or Cloudflare Turnstile secret. Secrets belong in the Supabase dashboard,
never in this repository. For global per-IP HTTP 429 enforcement, place public
write operations behind an Edge Function or gateway; direct PostgREST traffic
cannot implement an application-wide custom limiter.

## 4. Encryption and region verification

In Supabase Dashboard:

- Confirm the project region satisfies the intended data-residency requirement.
- Confirm database and Storage encryption at rest is active for the plan.
- Restrict dashboard membership and require MFA for organization members.
- Review API keys and rotate any key suspected of exposure.
- Keep the service-role key only in server/Edge Function secrets.

## Deployment order

1. Confirm migrations `0022`–`0025` exist in production.
2. Enable hosted TOTP support.
3. Deploy migration `0026`.
4. Deploy the frontend containing `RequireAdminMfa`.
5. Apply the hosted password, CAPTCHA, rate-limit, encryption, and region settings.
