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
  const { data, error } = await (supabase.rpc as any)("publish_catalog_item", {
    p_table: configs[kind].table,
    p_id: id,
    p_visibility: visibility,
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
  reason: string,
) {
  const { data, error } = await (supabase.rpc as any)("report_catalog_item", {
    p_table: configs[kind].table,
    p_id: id,
    p_reason: reason,
  });
  if (error) throw error;
  return data as string;
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
export async function listCatalogSources() {
  const { data, error } = await from("external_catalog_sources")
    .select("*")
    .order("display_name");
  if (error) throw error;
  return data ?? [];
}
export async function setCatalogSourceEnabled(
  provider: string,
  enabled: boolean,
) {
  const { error } = await from("external_catalog_sources")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("provider", provider);
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
export async function importCatalog(
  provider: string,
  query: string,
  limit = 20,
) {
  const { data, error } = await supabase.functions.invoke("catalog-import", {
    body: { provider, query, limit },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
