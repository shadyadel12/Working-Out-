import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import { useLanguage } from "../../i18n/MobileLanguage";
import { supabase } from "../../lib/supabase";
import { colors, radius, spacing } from "../../theme";
import { Button, Input } from "../../components/Controls";
import { Card, Screen, textStyles } from "../../components/Screen";

type Kind = "exercises" | "workouts" | "ingredients" | "recipes" | "meal-plans";
type Tab = "all-public" | "your-public" | "your-private" | "drafts";
const config: Record<Kind, { table: string; title: string }> = {
  exercises: { table: "exercise_library", title: "name" },
  workouts: { table: "workout_templates", title: "name" },
  ingredients: { table: "food_items", title: "name" },
  recipes: { table: "dishes", title: "title" },
  "meal-plans": { table: "menu_templates", title: "title" },
};
const ar = {
  title: "المكتبات العامة والخاصة",
  all: "كل العناصر العامة",
  minePublic: "عناصرك العامة",
  minePrivate: "عناصرك الخاصة",
  drafts: "المسودات",
  copy: "نسخ إلى الخاصة",
  report: "إبلاغ",
  public: "نشر للعامة",
  private: "نشر بشكل خاص",
  reason: "اكتب سبب البلاغ",
  send: "إرسال البلاغ",
};
const en = {
  title: "Private & Public Libraries",
  all: "All Public Items",
  minePublic: "Your Public Items",
  minePrivate: "Your Private Items",
  drafts: "Drafts",
  copy: "COPY TO PRIVATE",
  report: "REPORT",
  public: "PUBLISH PUBLICLY",
  private: "PUBLISH PRIVATELY",
  reason: "Report reason",
  send: "SEND REPORT",
};
export default function PublicLibrariesScreen() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const t = language === "ar" ? ar : en;
  const coachId = session!.user.id;
  const [kind, setKind] = useState<Kind>("exercises");
  const [tab, setTab] = useState<Tab>("all-public");
  const [rows, setRows] = useState<any[] | null>(null);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState<"newest" | "name">("newest");
  const [reportId, setReportId] = useState("");
  const [reason, setReason] = useState("");
  async function load() {
    setRows(null);
    const { data, error } = await (
      supabase.from(config[kind].table as never) as any
    )
      .select("*")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    if (error) Alert.alert("Could not load", error.message);
    setRows(data ?? []);
  }
  useEffect(() => {
    void load();
  }, [kind]);
  const filtered = useMemo(
    () =>
      (rows ?? [])
        .filter((x) => {
          const publicItem =
            x.visibility === "public" && x.lifecycle === "published";
          const match =
            tab === "all-public"
              ? publicItem
              : tab === "your-public"
                ? x.coach_id === coachId && publicItem
                : tab === "your-private"
                  ? x.coach_id === coachId &&
                    x.visibility === "private" &&
                    x.lifecycle !== "draft"
                  : x.coach_id === coachId && x.lifecycle === "draft";
          return (
            match &&
            (!source || x.source_provider === source) &&
            String(x[config[kind].title] ?? "")
              .toLowerCase()
              .includes(search.toLowerCase())
          );
        })
        .sort((a, b) =>
          sort === "name"
            ? String(a[config[kind].title]).localeCompare(
                String(b[config[kind].title]),
              )
            : new Date(b.updated_at ?? b.created_at).getTime() -
              new Date(a.updated_at ?? a.created_at).getTime(),
        ),
    [rows, tab, coachId, search, kind, source, sort],
  );
  const count = (value: Tab) =>
    (rows ?? []).filter((x) =>
      value === "all-public"
        ? x.visibility === "public" && x.lifecycle === "published"
        : value === "your-public"
          ? x.coach_id === coachId &&
            x.visibility === "public" &&
            x.lifecycle === "published"
          : value === "your-private"
            ? x.coach_id === coachId &&
              x.visibility === "private" &&
              x.lifecycle !== "draft"
            : x.coach_id === coachId && x.lifecycle === "draft",
    ).length;
  async function rpc(name: string, args: any) {
    const { error } = await (supabase.rpc as any)(name, args);
    if (error) Alert.alert("Could not complete action", error.message);
    else void load();
  }
  return (
    <Screen title={t.title}>
      <View style={[styles.wrap, language === "ar" && styles.rtl]}>
        {(Object.keys(config) as Kind[]).map((x) => (
          <Pressable
            key={x}
            onPress={() => setKind(x)}
            style={[styles.chip, kind === x && styles.on]}
          >
            <Text style={styles.chipText}>{x}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.wrap, language === "ar" && styles.rtl]}>
        {(
          [
            ["all-public", t.all],
            ["your-public", t.minePublic],
            ["your-private", t.minePrivate],
            ["drafts", t.drafts],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setTab(value)}
            style={[styles.chip, tab === value && styles.on]}
          >
            <Text style={styles.chipText}>
              {label} ({count(value)})
            </Text>
          </Pressable>
        ))}
      </View>
      <Input value={search} onChangeText={setSearch} placeholder="Search" />
      <View style={[styles.wrap, language === "ar" && styles.rtl]}>
        <Pressable
          onPress={() => setSource("")}
          style={[styles.chip, !source && styles.on]}
        >
          <Text style={styles.chipText}>All sources</Text>
        </Pressable>
        {[
          ...new Set(
            (rows ?? [])
              .map((x) => x.source_provider)
              .filter(Boolean) as string[],
          ),
        ].map((value) => (
          <Pressable
            key={value}
            onPress={() => setSource(value)}
            style={[styles.chip, source === value && styles.on]}
          >
            <Text style={styles.chipText}>{value}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setSort(sort === "newest" ? "name" : "newest")}
          style={styles.chip}
        >
          <Text style={styles.chipText}>
            {sort === "newest" ? "Newest first" : "Name A-Z"}
          </Text>
        </Pressable>
      </View>
      {!rows ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        filtered.map((item) => (
          <Card key={item.id}>
            <Text
              style={[textStyles.heading, language === "ar" && styles.right]}
            >
              {item[config[kind].title]}
            </Text>
            <Text style={[textStyles.muted, language === "ar" && styles.right]}>
              {item.creator_name || "Trainova coach"} · v{item.revision ?? 1}
              {item.source_provider ? ` · ${item.source_provider}` : ""}
            </Text>
            {item.source_attribution ? (
              <Text
                style={[textStyles.muted, language === "ar" && styles.right]}
              >
                {item.source_attribution} · {item.source_license}
              </Text>
            ) : null}
            {item.coach_id === coachId ? (
              <>
                <Button
                  secondary
                  onPress={() =>
                    rpc("publish_catalog_item", {
                      p_table: config[kind].table,
                      p_id: item.id,
                      p_visibility: "private",
                    })
                  }
                >
                  {t.private}
                </Button>
                <Button
                  onPress={() =>
                    rpc("publish_catalog_item", {
                      p_table: config[kind].table,
                      p_id: item.id,
                      p_visibility: "public",
                    })
                  }
                >
                  {t.public}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onPress={() =>
                    rpc("copy_public_catalog_item", {
                      p_table: config[kind].table,
                      p_id: item.id,
                    })
                  }
                >
                  {t.copy}
                </Button>
                <Button secondary onPress={() => setReportId(item.id)}>
                  {t.report}
                </Button>
              </>
            )}
            {reportId === item.id ? (
              <>
                <Input
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t.reason}
                  multiline
                />
                <Button
                  onPress={() => {
                    if (reason.trim().length < 3) return;
                    void rpc("report_catalog_item", {
                      p_table: config[kind].table,
                      p_id: item.id,
                      p_reason: reason.trim(),
                    });
                    setReason("");
                    setReportId("");
                  }}
                >
                  {t.send}
                </Button>
              </>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rtl: { flexDirection: "row-reverse" },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  on: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  chipText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  right: { textAlign: "right", writingDirection: "rtl" },
});
