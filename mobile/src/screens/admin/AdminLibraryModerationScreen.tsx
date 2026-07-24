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
type Mode = "items" | "reports" | "audit";
export default function AdminLibraryModerationScreen() {
  const [mode, setMode] = useState<Mode>("items");
  const [kind, setKind] = useState<keyof typeof kinds>("exercises");
  const [rows, setRows] = useState<any[] | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  async function load() {
    const [i, r, a] = await Promise.all([
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
    ]);
    if (i.error) Alert.alert("Could not load", i.error.message);
    setRows(i.data ?? []);
    setReports(r.data ?? []);
    setAudit(a.data ?? []);
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
  async function actOnReport(report: any, status: 'hidden'|'removed'|'visible') {
    const { error }=await (supabase.rpc as any)('moderate_catalog_item',{p_table:report.entity_type,p_id:report.entity_id,p_status:status,p_reason:`${status} from report ${report.id}`});
    if(error) Alert.alert('Could not moderate',error.message); else void load();
  }
  async function suspend(report:any){if(!report.owner_id)return;const{error}=await(supabase.rpc as any)('moderate_user_account',{p_user:report.owner_id,p_suspend:true,p_reason:`Repeat-offender review from report ${report.id}`});if(error)Alert.alert('Could not suspend',error.message);else void load();}
  return (
    <Screen
      title="Library Moderation"
      subtitle="Reports, audit history and takedowns"
    >
      <View style={styles.wrap}>
        {(["items", "reports", "audit"] as Mode[]).map((value) => (
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
                <Text style={textStyles.heading}>{x.reason_code ?? x.reason} · {x.severity ?? 'normal'}</Text>
                {x.details ? <Text style={textStyles.body}>{x.details}</Text> : null}
                <Text style={textStyles.muted}>
                  {x.entity_type} · {x.entity_id}
                </Text>
                <Button secondary onPress={()=>actOnReport(x,'hidden')}>HIDE ITEM</Button><Button danger onPress={()=>actOnReport(x,'removed')}>REMOVE ITEM</Button><Button onPress={()=>actOnReport(x,'visible')}>RESTORE / DISMISS</Button><Button danger onPress={()=>suspend(x)}>SUSPEND USER</Button>
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
