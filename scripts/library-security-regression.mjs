import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const databaseSql = [
  '../supabase/migrations/0048_coach_library_platform.sql',
  '../supabase/migrations/0071_private_public_library.sql',
  '../supabase/migrations/0074_disable_external_catalog_apis.sql',
  '../supabase/migrations/0076_app_store_privacy_ugc.sql',
].map(read).join('\n');

const required = [
  "default 'private'", "visibility='public'", "lifecycle='published'", "moderation_status='visible'",
  'publication_state', 'copy_public_catalog_item', 'report_catalog_item_compliant', 'moderate_catalog_item',
  'library_audit_events', 'source_provider,external_id', 'content_hash', 'external_catalog_quarantine',
  'soft_delete_library_item', 'assign_workout_template', 'is_template_override=true',
  'community_standards_accepted_at', 'public_display_name', 'ownership_attestation', 'user_blocks',
  'begin_account_deletion', 'account_file_deletion_queue', "enabled = false",
];
for (const token of required) if (!databaseSql.includes(token)) throw new Error(`Library security migration is missing: ${token}`);

const importerUrl = new URL('../supabase/functions/catalog-import/index.ts', import.meta.url);
if (existsSync(importerUrl)) throw new Error('The external catalog importer must remain removed.');
for (const provider of ['wger','usda_fdc','open_food_facts']) {
  if (!databaseSql.includes(provider)) throw new Error(`Disabled provider state is missing: ${provider}`);
}
if (!databaseSql.includes("publication_state='clean'") || !databaseSql.includes('publication_quarantined')) {
  throw new Error('Public discovery must be limited to clean server-moderated items.');
}
if (!databaseSql.includes("on delete set null") || !databaseSql.includes('actor_hash')) {
  throw new Error('Account deletion must preserve only pseudonymous audit history.');
}
console.log('Private/public library and App Store safety checks passed.');
