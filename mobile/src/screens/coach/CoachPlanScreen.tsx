import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, Screen, textStyles } from "../../components/Screen";
import { Button, Input } from "../../components/Controls";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import { dayNames } from "../../lib/dates";
import { colors } from "../../theme";
import { currentProgramWeek } from "../../lib/dates";

type Mode = "schedule" | "dietSchedule" | "workout" | "diet" | "assign";
type DuplicateRange =
  "dayNextWeek" | "dayWeek" | "dayMonth" | "weekNext" | "weekMonth";
export default function CoachPlanScreen() {
  const { effectiveCoachId } = useAuth();
  const coachId = effectiveCoachId!;
  const [players, setPlayers] = useState<any[]>([]),
    [playerId, setPlayerId] = useState("");
  const [week, setWeek] = useState(1),
    [day, setDay] = useState(1),
    [mode, setMode] = useState<Mode>("schedule");
  const [schedule, setSchedule] = useState<any[]>([]),
    [dietSchedule, setDietSchedule] = useState<any[]>([]),
    [workouts, setWorkouts] = useState<any[]>([]),
    [diets, setDiets] = useState<any[]>([]),
    [programs, setPrograms] = useState<any[]>([]);
  async function base() {
    const [p, w, d, g] = await Promise.all([
      supabase
        .from("coach_player_links")
        .select(
          "player_id,created_at,subscription_end_date,profiles!coach_player_links_player_id_fkey(name,email)",
        )
        .eq("coach_id", coachId)
        .eq("status", "active")
        .not("player_id", "is", null),
      supabase.from("workout_templates").select("id,name").order("name"),
      supabase.from("diet_templates").select("id,name").order("name"),
      supabase.from("program_templates").select("*").order("name"),
    ]);
    const list = (p.data ?? []).map((x: any) => ({
      id: x.player_id,
      name: x.profiles?.name || x.profiles?.email,
      createdAt: x.created_at,
      maxWeek: Math.max(1,Math.ceil((new Date(x.subscription_end_date).getTime()-new Date(x.created_at).getTime())/(7*24*60*60*1000))),
    }));
    setPlayers(list);
    setWorkouts(w.data ?? []);
    setDiets(d.data ?? []);
    setPrograms(g.data ?? []);
  }
  async function load() {
    if (!playerId) return;
    const [programResult, dietResult] = await Promise.all([
      supabase
        .from("program_days")
        .select("*,workouts(*,exercises(*))")
        .eq("player_id", playerId)
        .eq("week_number", week),
      supabase
        .from("diet_days")
        .select("*")
        .eq("player_id", playerId)
        .eq("week_number", week),
    ]);
    if (programResult.error)
      Alert.alert("Could not load", programResult.error.message);
    else setSchedule(programResult.data ?? []);
    if (dietResult.error)
      Alert.alert("Could not load diet", dietResult.error.message);
    else setDietSchedule(dietResult.data ?? []);
  }
  useEffect(() => {
    void base();
  }, [effectiveCoachId]);
  useEffect(() => {
    void load();
  }, [playerId, week]);
  const selected = schedule.find((x) => x.day_of_week === day);
  const selectedDiet = dietSchedule.find((x) => x.day_of_week === day);
  async function ensure(d = day, type = "training") {
    const { data, error } = await supabase
      .from("program_days")
      .upsert(
        {
          player_id: playerId,
          coach_id: coachId,
          week_number: week,
          day_of_week: d,
          day_type: type,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "player_id,week_number,day_of_week" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  async function remove() {
    if (!selected) return;
    const { error } = await supabase
      .from("program_days")
      .delete()
      .eq("id", selected.id);
    if (error) Alert.alert("Could not delete", error.message);
    else void load();
  }
  async function copyWorkoutDay(
    source: any,
    targetWeek: number,
    targetDay: number,
  ) {
    if (source.week_number === targetWeek && source.day_of_week === targetDay)
      return;
    const d = await ensureTarget(targetWeek, targetDay, source.day_type);
    const { error: clearError } = await supabase
      .from("workouts")
      .delete()
      .eq("program_day_id", d.id);
    if (clearError) throw clearError;
    for (const w of source.workouts ?? []) {
      const { data: nw, error } = await supabase
        .from("workouts")
        .insert({
          program_day_id: d.id,
          name: w.name,
          position: w.position,
          template_id: w.template_id,
        })
        .select()
        .single();
      if (error) throw error;
      if (w.exercises?.length) {
        const { error: exerciseError } = await supabase
          .from("exercises")
          .insert(
            w.exercises.map((x: any) => ({
              workout_id: nw.id,
              position: x.position,
              name: x.name,
              template_exercise_id: x.template_exercise_id,
              is_template_override: x.is_template_override,
              target_sets: x.target_sets,
              target_reps: x.target_reps,
              target_weight: x.target_weight,
              coach_comment: x.coach_comment,
              coach_video_url: x.coach_video_url,
              coach_video_is_external: x.coach_video_is_external,
            })),
          );
        if (exerciseError) throw exerciseError;
      }
    }
  }
  async function ensureTarget(
    targetWeek: number,
    targetDay: number,
    type: string,
  ) {
    const { data, error } = await supabase
      .from("program_days")
      .upsert(
        {
          player_id: playerId,
          coach_id: coachId,
          week_number: targetWeek,
          day_of_week: targetDay,
          day_type: type,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "player_id,week_number,day_of_week" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  async function workoutSources() {
    const { data, error } = await supabase
      .from("program_days")
      .select("*,workouts(*,exercises(*))")
      .eq("player_id", playerId)
      .eq("week_number", week);
    if (error) throw error;
    return data ?? [];
  }
  async function duplicateWorkout(range: DuplicateRange) {
    try {
      if (!selected && range.startsWith("day"))
        throw new Error("Choose a day with a workout first.");
      if (range === "dayNextWeek")
        await copyWorkoutDay(selected, week + 1, day);
      if (range === "dayWeek")
        for (let d = 0; d < 7; d++) await copyWorkoutDay(selected, week, d);
      if (range === "dayMonth")
        for (let w = week; w < week + 4; w++)
          for (let d = 0; d < 7; d++) await copyWorkoutDay(selected, w, d);
      if (range === "weekNext" || range === "weekMonth") {
        const sources = await workoutSources();
        const targets =
          range === "weekNext"
            ? [week + 1]
            : [week + 1, week + 2, week + 3, week + 4];
        for (const targetWeek of targets)
          for (const source of sources)
            await copyWorkoutDay(source, targetWeek, source.day_of_week);
      }
      Alert.alert("Duplicated", "The workout schedule was copied.");
      void load();
    } catch (e) {
      Alert.alert("Could not duplicate", (e as Error).message);
    }
  }
  async function duplicateDiet(range: DuplicateRange) {
    try {
      const sources = range.startsWith("week")
        ? dietSchedule
        : selectedDiet
          ? [selectedDiet]
          : [];
      if (!sources.length)
        throw new Error("Choose a day or week with a diet first.");
      const copy = async (
        source: any,
        targetWeek: number,
        targetDay: number,
      ) => {
        if (
          source.week_number === targetWeek &&
          source.day_of_week === targetDay
        )
          return;
        const { error } = await supabase.from("diet_days").upsert(
          {
            player_id: playerId,
            coach_id: coachId,
            week_number: targetWeek,
            day_of_week: targetDay,
            meals: source.meals,
            comment: source.comment,
            template_id: source.template_id,
            is_template_override: source.is_template_override,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "player_id,week_number,day_of_week" },
        );
        if (error) throw error;
      };
      if (range === "dayNextWeek") await copy(selectedDiet, week + 1, day);
      if (range === "dayWeek")
        for (let d = 0; d < 7; d++) await copy(selectedDiet, week, d);
      if (range === "dayMonth")
        for (let w = week; w < week + 4; w++)
          for (let d = 0; d < 7; d++) await copy(selectedDiet, w, d);
      if (range === "weekNext" || range === "weekMonth") {
        const targets =
          range === "weekNext"
            ? [week + 1]
            : [week + 1, week + 2, week + 3, week + 4];
        for (const targetWeek of targets)
          for (const source of sources)
            await copy(source, targetWeek, source.day_of_week);
      }
      Alert.alert("Duplicated", "The diet schedule was copied.");
      void load();
    } catch (e) {
      Alert.alert("Could not duplicate", (e as Error).message);
    }
  }
  if (!playerId)
    return (
      <Screen
        title="Plans"
        subtitle="Choose a player to open their workout and diet plans"
      >
        <View style={styles.introStrip}>
          <Text style={textStyles.eyebrow}>COACHING PLANS</Text>
          <Text style={styles.introTitle}>Build the week with purpose.</Text>
          <Text style={textStyles.muted}>
            Select an athlete, then shape training and nutrition one day at a
            time.
          </Text>
        </View>
        {players.length === 0 ? (
          <Card>
            <Text style={textStyles.muted}>No active players available.</Text>
          </Card>
        ) : (
          players.map((player) => (
            <Pressable key={player.id} onPress={() => {setPlayerId(player.id);setWeek(currentProgramWeek(player.createdAt,player.maxWeek));}}>
              <View style={styles.playerCard}>
                <View style={styles.playerRow}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {(player.name || "P").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={textStyles.heading}>{player.name}</Text>
                    <View style={styles.playerMeta}>
                      <View style={styles.liveDot} />
                      <Text style={styles.playerMetaText}>
                        ACTIVE · OPEN PLAN
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </Screen>
    );
  return (
    <Screen
      title="Build Plans"
      subtitle="Weekly training, diet, and saved programs"
    >
      <View style={styles.plannerCard}>
        <Button secondary onPress={() => setPlayerId("")}>
          ← ALL PLAYERS
        </Button>
        <Text style={styles.playerName}>
          {players.find((p) => p.id === playerId)?.name || "Player plans"}
        </Text>
        <View style={styles.weekBar}>
          <Button secondary onPress={() => setWeek(Math.max(1, week - 1))}>
            ←
          </Button>
          <Text style={styles.week}>WEEK {week}</Text>
          <Button secondary onPress={() => setWeek(week + 1)}>
            →
          </Button>
        </View>
        <View style={styles.days}>
          {[6, 0, 1, 2, 3, 4, 5].map((x) => (
            <Chip
              key={x}
              active={day === x}
              text={dayNames[x].slice(0, 3)}
              onPress={() => setDay(x)}
            />
          ))}
        </View>
      </View>
      <View style={styles.modeRail}>
        {(
          ["schedule", "dietSchedule", "workout", "diet", "assign"] as Mode[]
        ).map((x) => (
          <Chip
            key={x}
            active={mode === x}
            text={
              x === "schedule"
                ? "Training"
                : x === "dietSchedule"
                  ? "Nutrition"
                  : x === "workout"
                    ? "+ Workout"
                    : x === "diet"
                      ? "+ Diet"
                      : "Assign"
            }
            onPress={() => setMode(x)}
          />
        ))}
      </View>
      {mode === "schedule" ? (
        <Schedule
          value={selected}
          remove={remove}
          duplicate={duplicateWorkout}
        />
      ) : mode === "dietSchedule" ? (
        <DietSchedule
          value={selectedDiet}
          reload={load}
          duplicate={duplicateDiet}
        />
      ) : mode === "workout" ? (
        <Workout
          playerId={playerId}
          coachId={coachId}
          week={week}
          day={day}
          templates={workouts}
          reload={load}
        />
      ) : mode === "diet" ? (
        <Diet
          playerId={playerId}
          coachId={coachId}
          week={week}
          day={day}
          templates={diets}
          value={selectedDiet}
          reload={load}
        />
      ) : (
        <Assign playerId={playerId} programs={programs} />
      )}
    </Screen>
  );
}
function Chip({
  active,
  text,
  onPress,
}: {
  active: boolean;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={styles.chipText}>{text.toUpperCase()}</Text>
    </Pressable>
  );
}
function Schedule({
  value,
  remove,
  duplicate,
}: {
  value: any;
  remove: () => void;
  duplicate: (range: DuplicateRange) => void;
}) {
  const [range, setRange] = useState<DuplicateRange>("dayNextWeek");
  const [rangeOpen, setRangeOpen] = useState(false);
  if (!value)
    return (
      <Card>
        <Text style={textStyles.muted}>No plan for this day.</Text>
        <Text style={textStyles.muted}>
          You can still duplicate the full week.
        </Text>
        <DuplicateControl
          range={range}
          setRange={setRange}
          open={rangeOpen}
          setOpen={setRangeOpen}
          run={() => duplicate(range)}
        />
      </Card>
    );
  return (
    <Card>
      <Text style={textStyles.heading}>
        {value.day_type === "rest" ? "Rest day" : "Training day"}
      </Text>
      {(value.workouts ?? []).map((w: any) => (
        <View key={w.id} style={styles.block}>
          <Text style={textStyles.heading}>{w.name || "Saved workout"}</Text>
          {(w.exercises ?? []).map((e: any) => (
            <Text key={e.id} style={textStyles.muted}>
              • {e.name || "Saved exercise"} · {e.target_sets ?? "—"}×
              {e.target_reps ?? "—"}
            </Text>
          ))}
        </View>
      ))}
      <DuplicateControl
        range={range}
        setRange={setRange}
        open={rangeOpen}
        setOpen={setRangeOpen}
        run={() => duplicate(range)}
      />
      <Button danger onPress={remove}>
        DELETE DAY
      </Button>
    </Card>
  );
}
function DietSchedule({
  value,
  reload,
  duplicate,
}: {
  value: any;
  reload: () => void;
  duplicate: (range: DuplicateRange) => void;
}) {
  const [openMeal, setOpenMeal] = useState<number | null>(null);
  const [range, setRange] = useState<DuplicateRange>("dayNextWeek");
  const [rangeOpen, setRangeOpen] = useState(false);
  async function removeDiet() {
    if (!value) return;
    const { error } = await supabase
      .from("diet_days")
      .delete()
      .eq("id", value.id);
    if (error) Alert.alert("Could not delete", error.message);
    else void reload();
  }
  if (!value)
    return (
      <Card>
        <Text style={textStyles.muted}>No diet for this day.</Text>
        <Text style={textStyles.muted}>
          You can still duplicate the full week.
        </Text>
        <DuplicateControl
          range={range}
          setRange={setRange}
          open={rangeOpen}
          setOpen={setRangeOpen}
          run={() => duplicate(range)}
        />
      </Card>
    );
  return (
    <Card>
      <Text style={textStyles.heading}>Diet schedule</Text>
      {(value.meals ?? []).map((meal: any, index: number) => (
        <View key={`${meal.label}-${index}`} style={styles.exerciseCard}>
          <Pressable
            style={styles.dropdownHead}
            onPress={() => setOpenMeal(openMeal === index ? null : index)}
          >
            <Text style={styles.dropdownTitle}>
              {meal.label || `Meal ${index + 1}`}
            </Text>
            <Text style={styles.chevron}>{openMeal === index ? "▲" : "▼"}</Text>
          </Pressable>
          {openMeal === index ? (
            <View style={styles.compactDetails}>
              {(meal.items ?? []).map((item: any, itemIndex: number) => (
                <View key={itemIndex} style={styles.savedItem}>
                  <Text style={styles.savedItemText}>{item.food}</Text>
                  <Text style={textStyles.muted}>
                    {item.grams ? `${item.grams} g` : ""}
                  </Text>
                </View>
              ))}
              {meal.content ? (
                <Text style={textStyles.body}>{meal.content}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ))}
      {value.comment ? (
        <Text style={textStyles.muted}>{value.comment}</Text>
      ) : null}
      <DuplicateControl
        range={range}
        setRange={setRange}
        open={rangeOpen}
        setOpen={setRangeOpen}
        run={() => duplicate(range)}
      />
      <Button danger onPress={removeDiet}>
        DELETE DIET DAY
      </Button>
    </Card>
  );
}
const duplicateOptions: { key: DuplicateRange; label: string }[] = [
  { key: "dayNextWeek", label: "This day → next week" },
  { key: "dayWeek", label: "This day → entire week" },
  { key: "dayMonth", label: "This day → entire month" },
  { key: "weekNext", label: "Full week → next week" },
  { key: "weekMonth", label: "Full week → entire month" },
];
function DuplicateControl({
  range,
  setRange,
  open,
  setOpen,
  run,
}: {
  range: DuplicateRange;
  setRange: (x: DuplicateRange) => void;
  open: boolean;
  setOpen: (x: boolean) => void;
  run: () => void;
}) {
  const label = duplicateOptions.find((x) => x.key === range)!.label;
  return (
    <View style={styles.duplicateBox}>
      <View style={styles.actionRow}>
        <View style={styles.duplicateButton}>
          <Button secondary onPress={run}>
            DUPLICATE
          </Button>
        </View>
        <Pressable style={styles.rangeSelect} onPress={() => setOpen(!open)}>
          <Text style={styles.rangeText}>{label}</Text>
          <Text style={styles.chevron}>{open ? "▲" : "▼"}</Text>
        </Pressable>
      </View>
      {open ? (
        <View style={styles.rangeMenu}>
          {duplicateOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.rangeOption,
                range === option.key && styles.rangeOptionActive,
              ]}
              onPress={() => {
                setRange(option.key);
                setOpen(false);
              }}
            >
              <Text style={styles.rangeText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
function Workout({
  playerId,
  coachId,
  week,
  day,
  templates,
  reload,
}: {
  playerId: string;
  coachId: string;
  week: number;
  day: number;
  templates: any[];
  reload: () => void;
}) {
  type DraftExercise = {
    id: string;
    name: string;
    sets: string;
    reps: string;
    weight: string;
    note: string;
  };
  const [name, setName] = useState(""),
    [exercise, setExercise] = useState(""),
    [sets, setSets] = useState("3"),
    [reps, setReps] = useState("10"),
    [weight, setWeight] = useState(""),
    [note, setNote] = useState("");
  const [drafts, setDrafts] = useState<DraftExercise[]>([]);
  const [exerciseOpen, setExerciseOpen] = useState(true);
  const [openDraft, setOpenDraft] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  async function ensure() {
    const { data, error } = await supabase
      .from("program_days")
      .upsert(
        {
          player_id: playerId,
          coach_id: coachId,
          week_number: week,
          day_of_week: day,
          day_type: "training",
        },
        { onConflict: "player_id,week_number,day_of_week" },
      )
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  function currentDraft(): DraftExercise | null {
    if (!exercise.trim()) return null;
    return {
      id: `${Date.now()}`,
      name: exercise.trim(),
      sets,
      reps,
      weight,
      note,
    };
  }
  function addExercise() {
    const next = currentDraft();
    if (!next)
      return Alert.alert("Exercise required", "Enter an exercise name first.");
    setDrafts((items) => [...items, next]);
    setExercise("");
    setSets("3");
    setReps("10");
    setWeight("");
    setNote("");
    setExerciseOpen(false);
    setOpenDraft(next.id);
  }
  async function add() {
    const current = currentDraft();
    const exercises = current ? [...drafts, current] : drafts;
    if (!name.trim() || exercises.length === 0)
      return Alert.alert(
        "Workout required",
        "Enter a workout name and add at least one exercise.",
      );
    try {
      const d = await ensure();
      const { data: w, error } = await supabase
        .from("workouts")
        .insert({ program_day_id: d.id, name: name.trim(), position: 0 })
        .select()
        .single();
      if (error) throw error;
      const { error: e } = await supabase.from("exercises").insert(
        exercises.map((item, position) => ({
          workout_id: w.id,
          name: item.name,
          position,
          target_sets: Number(item.sets) || null,
          target_reps: item.reps || null,
          target_weight: item.weight || null,
          coach_comment: item.note || null,
          coach_video_url: null,
          coach_video_is_external: false,
        })),
      );
      if (e) throw e;
      setName("");
      setExercise("");
      setDrafts([]);
      setExerciseOpen(true);
      setOpenDraft(null);
      void reload();
    } catch (e) {
      Alert.alert("Could not add", (e as Error).message);
    }
  }
  async function saved(id: string) {
    try {
      const d = await ensure();
      const { error } = await supabase.rpc("assign_workout_template", {
        p_program_day_id: d.id,
        p_template_id: id,
        p_position: 0,
      });
      if (error) throw error;
      void reload();
    } catch (e) {
      Alert.alert("Could not assign", (e as Error).message);
    }
  }
  async function restDay() {
    try {
      const d = await ensure();
      const { error } = await supabase
        .from("program_days")
        .update({ day_type: "rest", updated_at: new Date().toISOString() })
        .eq("id", d.id);
      if (error) throw error;
      void reload();
    } catch (e) {
      Alert.alert("Could not save rest day", (e as Error).message);
    }
  }
  return (
    <>
      <Card>
        <Text style={textStyles.heading}>New workout</Text>
        <Input value={name} onChangeText={setName} placeholder="Workout name" />
        {drafts.map((item, index) => (
          <View key={item.id} style={styles.exerciseCard}>
            <Pressable
              style={styles.dropdownHead}
              onPress={() =>
                setOpenDraft(openDraft === item.id ? null : item.id)
              }
            >
              <Text style={styles.dropdownTitle}>
                Exercise {index + 1}: {item.name}
              </Text>
              <Text style={styles.chevron}>
                {openDraft === item.id ? "▲" : "▼"}
              </Text>
            </Pressable>
            {openDraft === item.id ? (
              <View style={styles.compactDetails}>
                <Text style={textStyles.muted}>
                  {item.sets || "—"} sets · {item.reps || "—"} reps
                  {item.weight ? ` · ${item.weight}` : ""}
                </Text>
                {item.note ? (
                  <Text style={textStyles.muted}>{item.note}</Text>
                ) : null}
                <Button
                  danger
                  onPress={() =>
                    setDrafts((items) => items.filter((x) => x.id !== item.id))
                  }
                >
                  REMOVE
                </Button>
              </View>
            ) : null}
          </View>
        ))}
        <View style={styles.exerciseCard}>
          <Pressable
            style={styles.dropdownHead}
            onPress={() => setExerciseOpen((value) => !value)}
          >
            <Text style={styles.dropdownTitle}>New exercise</Text>
            <Text style={styles.chevron}>{exerciseOpen ? "▲" : "▼"}</Text>
          </Pressable>
          {exerciseOpen ? (
            <View style={styles.exerciseFields}>
              <Input
                value={exercise}
                onChangeText={setExercise}
                placeholder="Exercise name"
              />
              <View style={styles.row}>
                <Input
                  style={styles.flex}
                  value={sets}
                  onChangeText={setSets}
                  placeholder="Sets"
                />
                <Input
                  style={styles.flex}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="Reps"
                />
                <Input
                  style={styles.flex}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Weight"
                />
              </View>
              <Input
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="Coach note"
              />
            </View>
          ) : null}
        </View>
        <View style={styles.actionRow}>
          <View style={styles.flex}>
            <Button onPress={add}>ADD WORKOUT</Button>
          </View>
          <View style={styles.flex}>
            <Button secondary onPress={addExercise}>
              ADD EXERCISE
            </Button>
          </View>
        </View>
      </Card>
      <Button secondary onPress={restDay}>
        MARK AS REST DAY
      </Button>
      <View style={styles.savedSection}>
        <Pressable
          style={styles.savedHeader}
          onPress={() => setSavedOpen((value) => !value)}
        >
          <Text style={styles.savedLabel}>Saved workouts</Text>
          <Text style={styles.chevron}>{savedOpen ? "▲" : "▼"}</Text>
        </Pressable>
        {savedOpen ? (
          <View style={styles.savedList}>
            {templates.length ? (
              templates.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.savedItem}
                  onPress={() => saved(t.id)}
                >
                  <Text style={styles.savedItemText}>{t.name}</Text>
                  <Text style={styles.savedAdd}>ADD</Text>
                </Pressable>
              ))
            ) : (
              <Text style={textStyles.muted}>No saved workouts yet.</Text>
            )}
          </View>
        ) : null}
      </View>
    </>
  );
}
function Diet({
  playerId,
  coachId,
  week,
  day,
  templates,
  value,
  reload,
}: {
  playerId: string;
  coachId: string;
  week: number;
  day: number;
  templates: any[];
  value: any;
  reload: () => void;
}) {
  type DraftMeal = { id: string; label: string; food: string; grams: string };
  const [label, setLabel] = useState("Meal 1"),
    [food, setFood] = useState(""),
    [grams, setGrams] = useState(""),
    [comment, setComment] = useState("");
  const [meals, setMeals] = useState<DraftMeal[]>([]);
  const [mealOpen, setMealOpen] = useState(true);
  const [openMeal, setOpenMeal] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  function currentMeal(): DraftMeal | null {
    if (!food.trim()) return null;
    return {
      id: `${Date.now()}`,
      label: label.trim() || `Meal ${meals.length + 1}`,
      food: food.trim(),
      grams,
    };
  }
  function addMeal() {
    const next = currentMeal();
    if (!next)
      return Alert.alert("Meal required", "Enter food before adding the meal.");
    setMeals((items) => [...items, next]);
    setLabel(`Meal ${meals.length + 2}`);
    setFood("");
    setGrams("");
    setMealOpen(false);
    setOpenMeal(next.id);
  }
  async function save() {
    const current = currentMeal();
    const allMeals = current ? [...meals, current] : meals;
    if (!allMeals.length)
      return Alert.alert(
        "Diet required",
        "Add at least one meal before saving.",
      );
    const payloadMeals = allMeals.map((meal) => ({
      type: "meal",
      label: meal.label,
      content: "",
      items: [{ food: meal.food, grams: meal.grams }],
    }));
    const { error } = await supabase.from("diet_days").upsert(
      {
        player_id: playerId,
        coach_id: coachId,
        week_number: week,
        day_of_week: day,
        meals: payloadMeals,
        comment: comment || null,
        is_template_override: true,
      },
      { onConflict: "player_id,week_number,day_of_week" },
    );
    if (error) Alert.alert("Could not save", error.message);
    else {
      setMeals([]);
      setFood("");
      setGrams("");
      setLabel("Meal 1");
      setMealOpen(true);
      setOpenMeal(null);
      void reload();
    }
  }
  async function saved(id: string) {
    const { error } = await supabase.rpc("assign_diet_template", {
      p_player_id: playerId,
      p_week: week,
      p_day_of_week: day,
      p_template_id: id,
    });
    if (error) Alert.alert("Could not assign", error.message);
    else void reload();
  }
  async function removeDiet() {
    if (!value) return;
    const { error } = await supabase
      .from("diet_days")
      .delete()
      .eq("id", value.id);
    if (error) Alert.alert("Could not delete", error.message);
    else void reload();
  }
  return (
    <>
      {false && (
        <Card>
          <Pressable
            style={styles.dropdownHead}
            onPress={() => setScheduleOpen((open) => !open)}
          >
            <View>
              <Text style={textStyles.heading}>Diet schedule</Text>
              <Text style={textStyles.muted}>
                {value
                  ? `${(value.meals ?? []).length} meals planned`
                  : "No diet for this day"}
              </Text>
            </View>
            <Text style={styles.chevron}>{scheduleOpen ? "▲" : "▼"}</Text>
          </Pressable>
          {scheduleOpen ? (
            value ? (
              <View style={styles.savedList}>
                {(value.meals ?? []).map((meal: any, index: number) => (
                  <View key={`${meal.label}-${index}`} style={styles.savedItem}>
                    <Text style={styles.savedItemText}>
                      {meal.label || `Meal ${index + 1}`}
                    </Text>
                    <Text style={textStyles.muted}>
                      {(meal.items ?? []).length} items
                    </Text>
                  </View>
                ))}
                {value.comment ? (
                  <Text style={textStyles.muted}>{value.comment}</Text>
                ) : null}
                <Button danger onPress={removeDiet}>
                  DELETE DIET DAY
                </Button>
              </View>
            ) : (
              <Text style={textStyles.muted}>No diet for this day.</Text>
            )
          ) : null}
        </Card>
      )}
      <Card>
        <Text style={textStyles.heading}>Diet day</Text>
        {meals.map((meal, index) => (
          <View key={meal.id} style={styles.exerciseCard}>
            <Pressable
              style={styles.dropdownHead}
              onPress={() => setOpenMeal(openMeal === meal.id ? null : meal.id)}
            >
              <Text style={styles.dropdownTitle}>
                Meal {index + 1}: {meal.label}
              </Text>
              <Text style={styles.chevron}>
                {openMeal === meal.id ? "▲" : "▼"}
              </Text>
            </Pressable>
            {openMeal === meal.id ? (
              <View style={styles.compactDetails}>
                <Text style={textStyles.body}>{meal.food}</Text>
                {meal.grams ? (
                  <Text style={textStyles.muted}>{meal.grams} g</Text>
                ) : null}
                <Button
                  danger
                  onPress={() =>
                    setMeals((items) => items.filter((x) => x.id !== meal.id))
                  }
                >
                  REMOVE
                </Button>
              </View>
            ) : null}
          </View>
        ))}
        <View style={styles.exerciseCard}>
          <Pressable
            style={styles.dropdownHead}
            onPress={() => setMealOpen((value) => !value)}
          >
            <Text style={styles.dropdownTitle}>New meal</Text>
            <Text style={styles.chevron}>{mealOpen ? "▲" : "▼"}</Text>
          </Pressable>
          {mealOpen ? (
            <View style={styles.exerciseFields}>
              <Input
                value={label}
                onChangeText={setLabel}
                placeholder="Meal label"
              />
              <Input value={food} onChangeText={setFood} placeholder="Food" />
              <Input
                value={grams}
                onChangeText={setGrams}
                placeholder="Grams"
              />
            </View>
          ) : null}
        </View>
        <Input
          value={comment}
          onChangeText={setComment}
          multiline
          placeholder="Coach comment"
        />
        <View style={styles.actionRow}>
          <View style={styles.flex}>
            <Button onPress={save}>SAVE DIET</Button>
          </View>
          <View style={styles.flex}>
            <Button secondary onPress={addMeal}>
              ADD MEAL
            </Button>
          </View>
        </View>
      </Card>
      <View style={styles.savedSection}>
        <Pressable
          style={styles.savedHeader}
          onPress={() => setSavedOpen((value) => !value)}
        >
          <Text style={styles.savedLabel}>Saved diets</Text>
          <Text style={styles.chevron}>{savedOpen ? "▲" : "▼"}</Text>
        </Pressable>
        {savedOpen ? (
          <View style={styles.savedList}>
            {templates.length ? (
              templates.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.savedItem}
                  onPress={() => saved(t.id)}
                >
                  <Text style={styles.savedItemText}>{t.name}</Text>
                  <Text style={styles.savedAdd}>ADD</Text>
                </Pressable>
              ))
            ) : (
              <Text style={textStyles.muted}>No saved diets yet.</Text>
            )}
          </View>
        ) : null}
      </View>
    </>
  );
}
function Assign({ playerId, programs }: { playerId: string; programs: any[] }) {
  const [start, setStart] = useState("1");
  async function apply(p: any) {
    const { error } = await (supabase.rpc as any)(
      "assign_program_template_to_player",
      {
        p_player_id: playerId,
        p_program_template_id: p.id,
        p_start_week: Number(start) || 1,
      },
    );
    if (error) Alert.alert("Could not assign", error.message);
    else Alert.alert("Assigned", `${p.name} starts in week ${start}.`);
  }
  return (
    <>
      <Card>
        <Text style={textStyles.heading}>Assign whole program</Text>
        <Input
          value={start}
          onChangeText={setStart}
          keyboardType="number-pad"
          placeholder="Starting week"
        />
        <Text style={textStyles.muted}>
          This replaces the schedule across the saved program’s weeks.
        </Text>
      </Card>
      {programs.map((p) => (
        <Card key={p.id}>
          <Text style={textStyles.heading}>{p.name}</Text>
          <Text style={textStyles.muted}>
            {p.difficulty} · {p.duration_weeks} weeks
          </Text>
          <Button onPress={() => apply(p)}>ASSIGN PROGRAM</Button>
        </Card>
      ))}
    </>
  );
}
const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  introStrip: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    gap: 7,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  introTitle: {
    color: colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    maxWidth: 280,
  },
  playerCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#25252c",
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 3,
  },
  playerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  playerMetaText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  plannerCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: "#292930",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  playerName: {
    color: colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  weekBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 6,
  },
  modeRail: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: "#25252c",
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#34343d",
    borderRadius: 99,
    backgroundColor: colors.background,
  },
  active: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 10, fontWeight: "900" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  days: { flexDirection: "row", justifyContent: "space-between", gap: 3 },
  week: { color: colors.text, fontWeight: "900", letterSpacing: 0.8 },
  block: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    gap: 3,
  },
  flex: { flex: 1 },
  actionRow: { flexDirection: "row", gap: 8 },
  exerciseCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
  },
  dropdownHead: {
    minHeight: 46,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceRaised,
  },
  dropdownTitle: { color: colors.text, fontWeight: "800", flex: 1 },
  chevron: { color: colors.accent, fontSize: 12, fontWeight: "900" },
  exerciseFields: { padding: 10, gap: 8 },
  compactDetails: { padding: 10, gap: 8 },
  savedSection: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  savedHeader: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savedLabel: { color: colors.text, fontSize: 13, fontWeight: "800" },
  savedList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 8,
    gap: 6,
  },
  savedItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  savedItemText: { color: colors.text, fontWeight: "700", flex: 1 },
  savedAdd: { color: colors.accent, fontSize: 11, fontWeight: "900" },
  playerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarText: { color: "#fff", fontWeight: "900" },
  duplicateBox: { gap: 6 },
  duplicateButton: { width: 112 },
  rangeSelect: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  rangeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  rangeMenu: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 6,
    gap: 4,
    backgroundColor: colors.surfaceRaised,
  },
  rangeOption: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rangeOptionActive: { backgroundColor: colors.accentSoft },
});
