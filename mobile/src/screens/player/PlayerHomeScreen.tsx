import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card, Screen, textStyles } from "../../components/Screen";
import { Button, Input } from "../../components/Controls";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import { colors, radius } from "../../theme";
import { FitnessHero, OutlinePill } from "../../components/FitnessHero";
const empty = {
  gender: "",
  date_of_birth: "",
  height: "",
  country: "",
  mobile_number: "",
  sport: "",
  position: "",
  sport_level: "",
  experience_level: "",
};
export default function PlayerHomeScreen() {
  const { session, profile, signOut } = useAuth();
  const [data, setData] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const [link, logs, diet, details] = await Promise.all([
      supabase
        .from("coach_player_links")
        .select("status,subscription_end_date,is_vip")
        .eq("player_id", session!.user.id)
        .order("subscription_end_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("exercise_logs")
        .select("is_completed")
        .eq("player_id", session!.user.id)
        .eq("log_date", today),
      supabase
        .from("diet_logs")
        .select("completed_meals,total_meals")
        .eq("player_id", session!.user.id)
        .eq("log_date", today)
        .maybeSingle(),
      supabase
        .from("player_details")
        .select("*")
        .eq("player_id", session!.user.id)
        .maybeSingle(),
    ]);
    if (details.data) {
      const {
        gender,
        date_of_birth,
        height,
        country,
        mobile_number,
        sport,
        position,
        sport_level,
        experience_level,
      } = details.data;
      setForm({
        gender,
        date_of_birth,
        height,
        country,
        mobile_number,
        sport,
        position,
        sport_level,
        experience_level,
      });
    } else setEditing(true);
    setData({
      link: link.data,
      workouts: (logs.data ?? []).length,
      completed: (logs.data ?? []).filter((x) => x.is_completed).length,
      diet: diet.data,
      details: details.data,
    });
  }
  useEffect(() => {
    void load();
  }, [session]);
  async function save() {
    if (!Object.values(form).every((x) => x.trim()))
      return Alert.alert(
        "Complete every field",
        "Your coach needs all profile fields to prepare a suitable plan.",
      );
    setBusy(true);
    const { error } = await supabase
      .from("player_details")
      .upsert(
        {
          player_id: session!.user.id,
          ...form,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "player_id" },
      );
    setBusy(false);
    if (error) Alert.alert("Could not save", error.message);
    else {
      setEditing(false);
      void load();
    }
  }
  return (
    <Screen
      title={`Hi, ${profile?.name?.split(" ")[0] || "Athlete"}`}
      subtitle="Your plan, progress, and coach in one place"
    >
      {!editing?<FitnessHero eyebrow="Your training system" title="Earn your progress" subtitle="Follow the plan, log the work, and stay connected to your coach."><OutlinePill text={data?.link?.is_vip?'VIP coaching':'Personal coaching'}/></FitnessHero>:null}
      {!data ? (
        <ActivityIndicator color={colors.accent} />
      ) : editing ? (
        <ProfileForm
          form={form}
          setForm={setForm}
          save={save}
          busy={busy}
          canCancel={!!data.details}
          cancel={() => setEditing(false)}
        />
      ) : (
        <>
          <Card>
            <View style={styles.status}>
              <View>
                <Text style={textStyles.eyebrow}>Membership</Text>
                <Text style={textStyles.heading}>
                  {data.link?.is_vip ? "VIP coaching" : "Active coaching"}
                </Text>
              </View>
              <Text style={styles.badge}>
                {data.link?.status?.toUpperCase() || "ACTIVE"}
              </Text>
            </View>
            <Text style={textStyles.muted}>
              Access through {data.link?.subscription_end_date || "—"}
            </Text>
          </Card>
          <View style={styles.row}>
            <Metric
              value={`${data.completed}/${data.workouts}`}
              label="Exercises today"
            />
            <Metric
              value={
                data.diet
                  ? `${data.diet.completed_meals}/${data.diet.total_meals}`
                  : "—"
              }
              label="Meals today"
            />
          </View>
          <Card>
            <Text style={textStyles.heading}>Today’s focus</Text>
            <Text style={textStyles.muted}>
              {data.workouts
                ? "Continue your program and record every completed set."
                : "Open Program to view today’s coaching plan."}
            </Text>
          </Card>
          <Card>
            <Text style={textStyles.heading}>My profile</Text>
            <Text style={textStyles.muted}>
              {form.sport} · {form.position} · {form.experience_level}
            </Text>
            <Button secondary onPress={() => setEditing(true)}>
              EDIT PROFILE
            </Button>
            <Button secondary onPress={signOut}>
              SIGN OUT
            </Button>
          </Card>
        </>
      )}
    </Screen>
  );
}
function ProfileForm({
  form,
  setForm,
  save,
  busy,
  canCancel,
  cancel,
}: {
  form: typeof empty;
  setForm: (x: typeof empty) => void;
  save: () => void;
  busy: boolean;
  canCancel: boolean;
  cancel: () => void;
}) {
  const field = (k: keyof typeof empty, v: string) =>
    setForm({ ...form, [k]: v });
  return (
    <Card>
      <Text style={textStyles.heading}>
        {canCancel ? "Edit profile" : "Complete your profile"}
      </Text>
      <Text style={textStyles.muted}>
        Your coach uses this information to create a safe, suitable plan.
      </Text>
      <Choice
        label="Gender"
        value={form.gender}
        choices={["Male", "Female", "Other", "Prefer not to say"]}
        onChange={(x) => field("gender", x)}
      />
      <Input
        value={form.date_of_birth}
        onChangeText={(x) => field("date_of_birth", x)}
        placeholder="Date of birth (YYYY-MM-DD)"
      />
      <Input
        value={form.height}
        onChangeText={(x) => field("height", x)}
        placeholder="Height (example: 175 cm)"
        maxLength={50}
      />
      <Input
        value={form.country}
        onChangeText={(x) => field("country", x)}
        placeholder="Country"
        maxLength={100}
      />
      <Input
        value={form.mobile_number}
        onChangeText={(x) => field("mobile_number", x)}
        placeholder="Mobile number"
        keyboardType="phone-pad"
        maxLength={30}
      />
      <Input
        value={form.sport}
        onChangeText={(x) => field("sport", x)}
        placeholder="Sport"
        maxLength={100}
      />
      <Input
        value={form.position}
        onChangeText={(x) => field("position", x)}
        placeholder="Position or role"
        maxLength={100}
      />
      <Choice
        label="Sport level"
        value={form.sport_level}
        choices={[
          "Recreational",
          "Amateur",
          "Semi-professional",
          "Professional",
        ]}
        onChange={(x) => field("sport_level", x)}
      />
      <Choice
        label="Experience"
        value={form.experience_level}
        choices={["Beginner", "Intermediate", "Advanced"]}
        onChange={(x) => field("experience_level", x)}
      />
      <Button onPress={save} disabled={busy}>
        {busy ? "SAVING…" : "SAVE PROFILE"}
      </Button>
      {canCancel ? (
        <Button secondary onPress={cancel}>
          CANCEL
        </Button>
      ) : null}
    </Card>
  );
}
function Choice({
  label,
  value,
  choices,
  onChange,
}: {
  label: string;
  value: string;
  choices: string[];
  onChange: (x: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={textStyles.muted}>{label}</Text>
      <View style={styles.choices}>
        {choices.map((x) => (
          <Pressable
            key={x}
            onPress={() => onChange(x)}
            style={[styles.choice, value === x && styles.choiceOn]}
          >
            <Text style={textStyles.body}>{x}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.value}>{value}</Text>
      <Text style={textStyles.muted}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  status: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "900",
    backgroundColor: "#123b2d",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },
  row: { flexDirection: "row", gap: 10 },
  metric: {
    flex: 1,
    minHeight: 100,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
  },
  value: { color: colors.accent, fontSize: 28, fontWeight: "900" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  choice: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  choiceOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
