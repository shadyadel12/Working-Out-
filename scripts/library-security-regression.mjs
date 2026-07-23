import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/0071_private_public_library.sql",
    import.meta.url,
  ),
  "utf8",
);
const baseMigration = readFileSync(
  new URL(
    "../supabase/migrations/0048_coach_library_platform.sql",
    import.meta.url,
  ),
  "utf8",
);
const databaseSql = `${baseMigration}\n${migration}`;
const importer = readFileSync(
  new URL("../supabase/functions/catalog-import/index.ts", import.meta.url),
  "utf8",
);
const required = [
  "default 'private'",
  "visibility='public'",
  "lifecycle='published'",
  "moderation_status='visible'",
  "copy_public_catalog_item",
  "report_catalog_item",
  "moderate_catalog_item",
  "public.auth_role()<>'admin'",
  "library_audit_events",
  "source_provider,external_id",
  "content_hash",
  "external_catalog_quarantine",
  "soft_delete_library_item",
  "assign_workout_template",
  "is_template_override=true",
];
for (const token of required)
  if (!databaseSql.includes(token))
    throw new Error(`Library security migration is missing: ${token}`);
if (!importer.includes("Deno.env.get('USDA_FDC_API_KEY')"))
  throw new Error("USDA key must be read server-side.");
if (!importer.includes("Deno.env.get('OPEN_FOOD_FACTS_USER_AGENT')"))
  throw new Error("Open Food Facts User-Agent is required.");
if (
  !importer.includes("verifiedJwtAal(auth)!=='aal2'") ||
  !importer.includes("profile?.role!=='admin'")
)
  throw new Error("Imports must require an MFA-verified administrator.");
if (/VITE_|EXPO_PUBLIC_/.test(importer))
  throw new Error(
    "Server catalog secrets must never use client-visible environment variables.",
  );
console.log("Private/public library security checks passed.");
