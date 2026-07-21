import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];

function requireText(path, text, reason) {
  if (!read(path).includes(text)) failures.push(`${path}: ${reason}`);
}

function forbidText(path, text, reason) {
  if (read(path).includes(text)) failures.push(`${path}: ${reason}`);
}

requireText('src/App.tsx', '<RequireRole role="admin">', 'admin route must retain its role guard');
requireText('src/App.tsx', '<RequireAdminMfa>', 'admin route must retain its MFA guard');
requireText('src/auth/AuthContext.tsx', 'effectiveCoachId', 'delegated team members need owner-coach context');
requireText('src/auth/RequireCoachCapability.tsx', "capability === 'owner'", 'delegated UI needs capability routing');

requireText('supabase/functions/r2-storage/index.ts', "if (profileRole === 'admin') return aal === 'aal2';", 'R2 admin access must require AAL2');
requireText('supabase/functions/r2-storage/index.ts', 'if (destructive) return row.owner_id === userId;', 'non-admin deletion must be owner-only');
requireText('supabase/functions/r2-storage/index.ts', "admin.rpc('register_private_upload'", 'upload registration must use the atomic quota RPC');
forbidText('supabase/functions/r2-storage/index.ts', 'application/pdf', 'support documents must not be accepted');
requireText('supabase/functions/scan-video/index.ts', "profile?.role === 'admin' && aal === 'aal2'", 'scanner admin access must require AAL2');

requireText('supabase/migrations/0055_security_assessment_remediation.sql', "using (public.auth_role() = 'admin')", 'direct admin policies must use the MFA-aware role helper');
requireText('supabase/migrations/0055_security_assessment_remediation.sql', 'pg_advisory_xact_lock', 'quota registration must serialize per owner');
requireText('supabase/migrations/0055_security_assessment_remediation.sql', 'set search_path = public, pg_temp', 'security-definer functions need a safe search path');
requireText('supabase/migrations/0055_security_assessment_remediation.sql', 'revoke create on schema public', 'application roles must not create objects in public');

const vercel = JSON.parse(read('vercel.json'));
const csp = vercel.headers.flatMap((entry) => entry.headers).find((header) => header.key === 'Content-Security-Policy')?.value ?? '';
const scriptDirective = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('script-src ')) ?? '';
if (!scriptDirective || scriptDirective.includes("'unsafe-inline'")) failures.push('vercel.json: script-src must block inline scripts');
forbidText('index.html', '<script>', 'inline bootstrap scripts are forbidden by CSP');

if (failures.length) {
  console.error(`Security regression check failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Security regression checks passed.');
