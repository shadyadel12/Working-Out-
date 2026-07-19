import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text } from "react-native";
import { Card, textStyles } from "../../components/Screen";
import { Button, Input } from "../../components/Controls";
import { useAuth } from "../../auth/AuthProvider";
import { supabase } from "../../lib/supabase";
import { colors } from "../../theme";

const emptyProgram = {
  name: "",
  description: "",
  difficulty: "Beginner",
  duration: "4",
};
const emptyDay = { week: "1", day: "1", name: "", notes: "" };
export function ProgramLibrary() {
  const { session } = useAuth();
  const [rows, setRows] = useState<any[] | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [program, setProgram] = useState(emptyProgram);
  const [scheduleProgram, setScheduleProgram] = useState<any>(null);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [day, setDay] = useState(emptyDay);
  async function load() {
    const { data, error } = await supabase
      .from("program_templates" as never)
      .select("*,program_template_days(*,program_template_day_workouts(*))")
      .order("name");
    if (error) Alert.alert("Could not load", error.message);
    setRows((data as any[]) ?? []);
  }
  useEffect(() => {
    void load();
  }, []);
  async function saveProgram() {
    if (!program.name.trim()) return;
    const payload = {
      coach_id: session!.user.id,
      name: program.name.trim(),
      description: program.description.trim() || null,
      difficulty: program.difficulty.trim() || "Beginner",
      duration_weeks: Math.max(1, Math.min(104, Number(program.duration) || 1)),
      updated_at: new Date().toISOString(),
    };
    const result = editing
      ? await (supabase.from("program_templates" as never) as any)
          .update(payload)
          .eq("id", editing.id)
      : await (supabase.from("program_templates" as never) as any).insert(
          payload,
        );
    if (result.error) Alert.alert("Could not save", result.error.message);
    else {
      setEditing(null);
      setProgram(emptyProgram);
      void load();
    }
  }
  function editProgram(x: any) {
    setEditing(x);
    setProgram({
      name: x.name,
      description: x.description ?? "",
      difficulty: x.difficulty,
      duration: String(x.duration_weeks),
    });
  }
  function openDay(p: any, d?: any) {
    setScheduleProgram(p);
    setEditingDay(d ?? null);
    const w = d?.program_template_day_workouts?.[0];
    setDay(
      d
        ? {
            week: String(d.week_number),
            day: String(d.day_number),
            name: w?.name ?? "",
            notes: w?.notes ?? "",
          }
        : emptyDay,
    );
  }
  async function saveDay() {
    if (!scheduleProgram || !day.name.trim()) return;
    const week = Math.max(
        1,
        Math.min(scheduleProgram.duration_weeks, Number(day.week) || 1),
      ),
      number = Math.max(1, Math.min(7, Number(day.day) || 1));
    let id = editingDay?.id;
    if (editingDay) {
      const r = await (supabase.from("program_template_days" as never) as any)
        .update({ week_number: week, day_number: number })
        .eq("id", id);
      if (r.error) return Alert.alert("Could not save", r.error.message);
    } else {
      const r = await (supabase.from("program_template_days" as never) as any)
        .insert({
          program_template_id: scheduleProgram.id,
          week_number: week,
          day_number: number,
        })
        .select("id")
        .single();
      if (r.error) return Alert.alert("Could not save", r.error.message);
      id = r.data.id;
    }
    const current = editingDay?.program_template_day_workouts?.[0],
      payload = {
        program_template_day_id: id,
        name: day.name.trim(),
        notes: day.notes.trim() || null,
        position: 0,
        exercise_library_ids: [],
      };
    const r = current
      ? await (supabase.from("program_template_day_workouts" as never) as any)
          .update(payload)
          .eq("id", current.id)
      : await (
          supabase.from("program_template_day_workouts" as never) as any
        ).insert(payload);
    if (r.error) Alert.alert("Could not save", r.error.message);
    else {
      setScheduleProgram(null);
      setEditingDay(null);
      setDay(emptyDay);
      void load();
    }
  }
  async function remove(table: string, id: string) {
    const { error } = await (supabase.from(table as never) as any)
      .delete()
      .eq("id", id);
    if (error) Alert.alert("Could not delete", error.message);
    else void load();
  }
  return (
    <>
      <Card>
        <Text style={textStyles.heading}>
          {editing ? "Edit program" : "Create program"}
        </Text>
        <Input
          value={program.name}
          onChangeText={(v) => setProgram({ ...program, name: v })}
          placeholder="Program name"
        />
        <Input
          value={program.description}
          onChangeText={(v) => setProgram({ ...program, description: v })}
          placeholder="Description"
          multiline
        />
        <Input
          value={program.difficulty}
          onChangeText={(v) => setProgram({ ...program, difficulty: v })}
          placeholder="Difficulty"
        />
        <Input
          value={program.duration}
          onChangeText={(v) => setProgram({ ...program, duration: v })}
          placeholder="Duration in weeks"
          keyboardType="number-pad"
        />
        <Button onPress={saveProgram}>
          {editing ? "SAVE PROGRAM" : "CREATE PROGRAM"}
        </Button>
        {editing ? (
          <Button
            secondary
            onPress={() => {
              setEditing(null);
              setProgram(emptyProgram);
            }}
          >
            CANCEL
          </Button>
        ) : null}
      </Card>
      {scheduleProgram ? (
        <Card>
          <Text style={textStyles.heading}>
            {editingDay ? "Edit scheduled workout" : "Add scheduled workout"}
          </Text>
          <Input
            value={day.week}
            onChangeText={(v) => setDay({ ...day, week: v })}
            placeholder="Week number"
            keyboardType="number-pad"
          />
          <Input
            value={day.day}
            onChangeText={(v) => setDay({ ...day, day: v })}
            placeholder="Day 1 to 7"
            keyboardType="number-pad"
          />
          <Input
            value={day.name}
            onChangeText={(v) => setDay({ ...day, name: v })}
            placeholder="Workout name"
          />
          <Input
            value={day.notes}
            onChangeText={(v) => setDay({ ...day, notes: v })}
            placeholder="Workout notes"
            multiline
          />
          <Button onPress={saveDay}>SAVE SCHEDULE</Button>
          <Button secondary onPress={() => setScheduleProgram(null)}>
            CANCEL
          </Button>
        </Card>
      ) : null}
      {!rows ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        rows.map((x) => (
          <Card key={x.id}>
            <Text style={textStyles.heading}>{x.name}</Text>
            <Text style={textStyles.muted}>
              {x.difficulty} · {x.duration_weeks} weeks
            </Text>
            <Text style={textStyles.body}>
              {x.description || "No description"}
            </Text>
            {(x.program_template_days ?? [])
              .sort(
                (a: any, b: any) =>
                  a.week_number - b.week_number || a.day_number - b.day_number,
              )
              .map((d: any) => (
                <Card key={d.id}>
                  <Text style={textStyles.body}>
                    Week {d.week_number} · Day {d.day_number} ·{" "}
                    {d.program_template_day_workouts?.[0]?.name || "Workout"}
                  </Text>
                  <Button secondary onPress={() => openDay(x, d)}>
                    EDIT DAY
                  </Button>
                  <Button
                    danger
                    onPress={() => remove("program_template_days", d.id)}
                  >
                    DELETE DAY
                  </Button>
                </Card>
              ))}
            <Button secondary onPress={() => openDay(x)}>
              ADD SCHEDULE DAY
            </Button>
            <Button secondary onPress={() => editProgram(x)}>
              EDIT PROGRAM
            </Button>
            <Button danger onPress={() => remove("program_templates", x.id)}>
              DELETE PROGRAM
            </Button>
          </Card>
        ))
      )}
    </>
  );
}
