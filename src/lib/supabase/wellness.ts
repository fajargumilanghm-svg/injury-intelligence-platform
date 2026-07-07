"use client";

import { createClient } from "@/lib/supabase/client";
import type { WellnessEntry, WellnessTrend } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

function calculateWellnessScore(entry: Omit<WellnessEntry, "id" | "wellness_score" | "submitted_at" | "athlete_id">): number {
  const values = [
    entry.sleep_quality,
    10 - entry.fatigue,
    10 - entry.muscle_soreness,
    10 - entry.stress_level,
    entry.mood_state,
    entry.recovery_feeling,
  ];
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round((avg / 10) * 100);
}

export async function getWellnessEntries(athleteId: string): Promise<WellnessEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("wellness_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("submitted_at", { ascending: false });
  return handleData<WellnessEntry>(data, error, "wellness.get-all");
}

export async function getTodayEntry(athleteId: string): Promise<WellnessEntry | null> {
  const supabase = createClient();
  // Use local date to avoid UTC timezone mismatch
  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local timezone
  const { data, error } = await supabase
    .from("wellness_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("submitted_at", `${today}T00:00:00`)
    .lte("submitted_at", `${today}T23:59:59`)
    .single();
  return handleSingle<WellnessEntry>(data, error, "wellness.get-today");
}

export async function submitWellness(
  athleteId: string,
  values: Omit<WellnessEntry, "id" | "wellness_score" | "submitted_at" | "athlete_id">
): Promise<WellnessEntry | null> {
  const supabase = createClient();
  const wellnessScore = calculateWellnessScore(values);
  const { data, error } = await supabase
    .from("wellness_entries")
    .insert({ ...values, athlete_id: athleteId, wellness_score: wellnessScore })
    .select()
    .single();
  return handleSingle<WellnessEntry>(data, error, "wellness.submit");
}

export async function updateWellness(
  id: string,
  values: Partial<Omit<WellnessEntry, "id" | "submitted_at" | "athlete_id">>
): Promise<WellnessEntry | null> {
  const supabase = createClient();
  const updateData: Record<string, unknown> = { ...values };
  // Recalculate wellness score if any contributing field is updated
  const wellnessFields = ["sleep_quality", "fatigue", "muscle_soreness", "stress_level", "mood_state", "recovery_feeling"];
  const hasWellnessField = wellnessFields.some((f) => f in values);
  if (hasWellnessField) {
    // Fetch existing entry to merge with partial update
    const { data: existing } = await supabase.from("wellness_entries").select("*").eq("id", id).single();
    if (existing) {
      const merged = {
        sleep_quality: values.sleep_quality ?? existing.sleep_quality,
        fatigue: values.fatigue ?? existing.fatigue,
        muscle_soreness: values.muscle_soreness ?? existing.muscle_soreness,
        stress_level: values.stress_level ?? existing.stress_level,
        mood_state: values.mood_state ?? existing.mood_state,
        recovery_feeling: values.recovery_feeling ?? existing.recovery_feeling,
      };
      updateData.wellness_score = calculateWellnessScore(merged);
    }
  }
  const { data, error } = await supabase
    .from("wellness_entries")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  return handleSingle<WellnessEntry>(data, error, "wellness.update");
}

export async function deleteWellness(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("wellness_entries").delete().eq("id", id);
  handleError(error, "wellness.delete");
}

export async function getWellnessTrend(athleteId: string, days = 30): Promise<WellnessTrend[]> {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("wellness_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("submitted_at", since.toISOString())
    .order("submitted_at", { ascending: true });
  const entries = handleData<WellnessEntry>(data, error, "wellness.get-trend");
  return entries.map((e) => ({
    date: new Date(e.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    wellness_score: e.wellness_score,
    sleep_quality: e.sleep_quality,
    fatigue: e.fatigue,
    muscle_soreness: e.muscle_soreness,
    stress_level: e.stress_level,
    mood_state: e.mood_state,
    recovery_feeling: e.recovery_feeling,
  }));
}

export { calculateWellnessScore };
