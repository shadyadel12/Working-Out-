import { supabase } from "../lib/supabase";

export type PublicLibraryKind =
  "exercises" | "workouts" | "ingredients" | "recipes" | "meal-plans";
export type LibraryVisibility = "private" | "public";
export type LibraryTab =
  "all-public" | "your-public" | "your-private" | "drafts";

const configs = {
  exercises: { table: "exercise_library", title: "name", category: "category" },
  workouts: {
    table: "workout_templates",
    title: "name",
    category: "difficulty",
  },
  ingredients: { table: "food_items", title: "name", category: "category" },
  recipes: { table: "dishes", title: "title", category: "category" },
  "meal-plans": { table: "menu_templates", title: "title", category: null },
} as const;

export interface PublicLibraryItem {
  id: string;
  coachId: string;
  title: string;
  category: string | null;
  lifecycle: "draft" | "published" | "archived";
  visibility: LibraryVisibility;
  revision: number;
  creatorName: string;
  creatorAttribution: string | null;
  sourceProvider: string | null;
  sourceUrl: string | null;
  sourceLicense: string | null;
  attribution: string | null;
  updatedAt: string;
  moderationStatus: "visible" | "hidden" | "removed";
  raw: Record<string, unknown>;
}

const from = (table: string) => supabase.from(table as never) as any;

export async function listPublicLibrary(
  kind: PublicLibraryKind,
): Promise<PublicLibraryItem[]> {
  const config = configs[kind];
  const { data, error } = await from(config.table)
    .select("*")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    coachId: row.coach_id,
    title: String(row[config.title] ?? ""),
    category: config.category ? (row[config.category] ?? null) : null,
    lifecycle: row.lifecycle ?? "published",
    visibility: row.visibility ?? "private",
    revision: row.revision ?? 1,
    creatorName: row.creator_name ?? "Trainova coach",
    creatorAttribution: row.creator_attribution ?? null,
    sourceProvider: row.source_provider ?? null,
    sourceUrl: row.source_url ?? null,
    sourceLicense: row.source_license ?? null,
    attribution: row.source_attribution ?? null,
    updatedAt: row.updated_at ?? row.created_at,
    moderationStatus: row.moderation_status ?? "visible",
    raw: row,
  }));
}

export function itemsForTab(
  items: PublicLibraryItem[],
  tab: LibraryTab,
  coachId: string,
) {
  if (tab === "all-public")
    return items.filter(
      (item) => item.visibility === "public" && item.lifecycle === "published",
    );
  if (tab === "your-public")
    return items.filter(
      (item) =>
        item.coachId === coachId &&
        item.visibility === "public" &&
        item.lifecycle === "published",
    );
  if (tab === "your-private")
    return items.filter(
      (item) =>
        item.coachId === coachId &&
        item.visibility === "private" &&
        item.lifecycle !== "draft",
    );
  return items.filter(
    (item) => item.coachId === coachId && item.lifecycle === "draft",
  );
}

export async function publishCatalogItem(
  kind: PublicLibraryKind,
  id: string,
  visibility: LibraryVisibility,
) {
  let displayName: string | null = null;
  let attribution: string | null = null;
  let acceptStandards = false;
  let ownership: string | null = null;
  let sourceUrl: string | null = null;
  let sourceLicense: string | null = null;
  let sourceAttribution: string | null = null;
  if (visibility === 'public') {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await (supabase.from('profiles') as any).select('public_display_name,public_attribution,community_standards_accepted_at').eq('id', user!.id).single();
    displayName = profile.public_display_name || window.prompt('Public display name (never use an email address):')?.trim() || null;
    if (!displayName) throw new Error('A public display name is required.');
    attribution = profile.public_attribution || window.prompt('Public attribution (how your credit should appear):', displayName) || displayName;
    acceptStandards = !!profile.community_standards_accepted_at || window.confirm('I accept the Trainova Community Standards, fitness-safety rules, ownership requirements, and moderation/takedown rules.');
    if (!acceptStandards) throw new Error('Accept the Community Standards before publishing.');
    ownership = window.prompt('Content rights: type original, licensed, or linked')?.trim().toLowerCase() || null;
    if (!['original','licensed','linked'].includes(ownership ?? '')) throw new Error('Choose original, licensed, or linked content.');
    if (ownership !== 'original') {
      sourceUrl = window.prompt('Source URL:')?.trim() || null;
      sourceLicense = window.prompt('License or permission:')?.trim() || null;
      sourceAttribution = window.prompt('Required public attribution:')?.trim() || null;
    }
  }
  const { data, error } = await (supabase.rpc as any)("publish_catalog_item_compliant", {
    p_table: configs[kind].table,
    p_id: id,
    p_visibility: visibility,
    p_display_name: displayName,
    p_public_attribution: attribution,
    p_accept_standards: acceptStandards,
    p_ownership: ownership,
    p_source_url: sourceUrl,
    p_source_license: sourceLicense,
    p_source_attribution: sourceAttribution,
  });
  if (error) throw error;
  return data as number;
}
export async function copyCatalogItem(kind: PublicLibraryKind, id: string) {
  const { data, error } = await (supabase.rpc as any)(
    "copy_public_catalog_item",
    { p_table: configs[kind].table, p_id: id },
  );
  if (error) throw error;
  return data as string;
}
export async function reportCatalogItem(
  kind: PublicLibraryKind,
  id: string,
  reasonCode: string,
  details?: string,
) {
  const { data, error } = await (supabase.rpc as any)("report_catalog_item_compliant", {
    p_table: configs[kind].table,
    p_id: id,
    p_reason_code: reasonCode,
    p_details: details ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function blockPublicCreator(creatorId: string) {
  const { error } = await (supabase.rpc as any)('block_user', { p_user: creatorId, p_scope: 'catalog', p_reason: 'Hidden from public library' });
  if (error) throw error;
}

export async function listModerationReports() {
  const { data, error } = await from("catalog_item_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function listModerationItems(kind: PublicLibraryKind) {
  const { data, error } = await from(configs[kind].table)
    .select("*")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function moderateCatalogItem(
  kind: PublicLibraryKind,
  id: string,
  status: "visible" | "hidden" | "removed",
  reason: string,
) {
  const { error } = await (supabase.rpc as any)("moderate_catalog_item", {
    p_table: configs[kind].table,
    p_id: id,
    p_status: status,
    p_reason: reason,
  });
  if (error) throw error;
}
export async function moderateUserAccount(userId: string, suspend: boolean, reason: string) {
  const { error } = await (supabase.rpc as any)('moderate_user_account', { p_user: userId, p_suspend: suspend, p_reason: reason });
  if (error) throw error;
}
export async function listCatalogAudit() {
  const { data, error } = await from("library_audit_events")
    .select("*")
    .in("entity_type", [
      "exercise_library",
      "workout_templates",
      "food_items",
      "dishes",
      "menu_templates",
    ])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}
