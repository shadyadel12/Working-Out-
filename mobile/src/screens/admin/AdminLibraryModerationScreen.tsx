import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../components/Controls";
import { Card, Screen, textStyles } from "../../components/Screen";
import { supabase } from "../../lib/supabase";
import { colors, radius, spacing } from "../../theme";

const kinds = {
  exercises: "exercise_library",
  workouts: "workout_templates",
  ingredients: "food_items",
  recipes: "dishes",
  "meal-plans": "menu_templates",
} as const;
type Mode = "items" | "reports" | "audit" | "sources";
export default function AdminLibraryModerationScreen() {
  const [mode, setMode] = useState<Mode>("items");
  const [kind, setKind] = useState<keyof typeof kinds>("exercises");
  const [rows, setRows] = useState<any[] | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  async function load() {
    const [i, r, a, s] = await Promise.all([
      (supabase.from(kinds[kind] as never) as any)
        .select("*")
        .eq("visibility", "public")
        .order("updated_at", { ascending: false }),
      (supabase.from("catalog_item_reports" as never) as any)
        .select("*")
        .order("created_at", { ascending: false }),
      (supabase.from("library_audit_events" as never) as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      (supabase.from("external_catalog_sources" as never) as any)
        .select("*")
        .order("display_name"),
    ]);
    if (i.error) Alert.alert("Could not load", i.error.message);
    setRows(i.data ?? []);
    setReports(r.data ?? []);
    setAudit(a.data ?? []);
    setSources(s.data ?? []);
  }
  useEffect(() => {
    void load();
  }, [kind]);
  async function moderate(
    id: string,
    status: "visible" | "hidden" | "removed",
  ) {
    const { error } = await (supabase.rpc as any)("moderate_catalog_item", {
      p_table: kinds[kind],
      p_id: id,
      p_status: status,
      p_reason:
        status === "visible" ? "Restored from mobile" : "Moderated from mobile",
    });
    if (error) Alert.alert("Could not moderate", error.message);
    else void load();
  }
  async function toggleSource(provider: string, enabled: boolean) {
    const { error } = await (
      supabase.from("external_catalog_sources" as never) as any
    )
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("provider", provider);
    if (error) Alert.alert("Could not update source", error.message);
    else void load();
  }
  return (
    <Screen
      title="Library Moderation"
      subtitle="Reports, audit history, takedowns and sources"
    >
      <View style={styles.wrap}>
        {(["items", "reports", "audit", "sources"] as Mode[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setMode(value)}
            style={[styles.chip, mode === value && styles.on]}
          >
            <Text style={styles.text}>{value}</Text>
          </Pressable>
        ))}
      </View>
      {mode === "items" ? (
        <>
          <View style={styles.wrap}>
            {(Object.keys(kinds) as (keyof typeof kinds)[]).map((value) => (
              <Pressable
                key={value}
                onPress={() => setKind(value)}
                style={[styles.chip, kind === value && styles.on]}
              >
                <Text style={styles.text}>{value}</Text>
              </Pressable>
            ))}
          </View>
          {rows === null ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            rows.map((x) => (
              <Card key={x.id}>
                <Text style={textStyles.heading}>{x.name ?? x.title}</Text>
                <Text style={textStyles.muted}>
                  {x.creator_name ?? "Coach"} · {x.moderation_status}
                </Text>
                {x.moderation_status !== "visible" ? (
                  <Button onPress={() => moderate(x.id, "visible")}>
                    RESTORE
                  </Button>
                ) : null}
                <Button secondary onPress={() => moderate(x.id, "hidden")}>
                  HIDE
                </Button>
                <Button danger onPress={() => moderate(x.id, "removed")}>
                  REMOVE
                </Button>
              </Card>
            ))
          )}
        </>
      ) : null}
      {mode === "reports" ? (
        <>
          <Text style={textStyles.heading}>
            Open reports ({reports.filter((x) => x.status === "open").length})
          </Text>
          {reports
            .filter((x) => x.status === "open")
            .map((x) => (
              <Card key={x.id}>
                <Text style={textStyles.body}>{x.reason}</Text>
                <Text style={textStyles.muted}>
                  {x.entity_type} · {x.entity_id}
                </Text>
              </Card>
            ))}
        </>
      ) : null}
      {mode === "audit"
        ? audit.map((x) => (
            <Card key={x.id}>
              <Text style={textStyles.heading}>{x.action}</Text>
              <Text style={textStyles.muted}>
                {x.entity_type} · {x.entity_id}
              </Text>
              <Text style={textStyles.muted}>
                {new Date(x.created_at).toLocaleString()}
              </Text>
            </Card>
          ))
        : null}
      {mode === "sources"
        ? sources.map((x) => (
            <Card key={x.provider}>
              <Text style={textStyles.heading}>{x.display_name}</Text>
              <Text style={textStyles.muted}>{x.attribution}</Text>
              <Text style={textStyles.muted}>
                {x.license_name} · {x.last_status}
              </Text>
              <Button
                danger={x.enabled}
                secondary={!x.enabled}
                onPress={() => toggleSource(x.provider, !x.enabled)}
              >
                {x.enabled ? "DISABLE" : "ENABLE"}
              </Button>
            </Card>
          ))
        : null}
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
  chip: {
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
  },
  on: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  text: { color: colors.text, fontWeight: "700" },
});
