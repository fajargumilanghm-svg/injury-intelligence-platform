"use client";

import { createClient } from "@/lib/supabase/client";
import type { WellnessEntry, TrainingEntry, InjuryRecord, Athlete } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export interface AthleteReportData {
  athlete: Athlete | null;
  wellnessEntries: WellnessEntry[];
  trainingEntries: TrainingEntry[];
  injuries: InjuryRecord[];
  avgWellness: number | null;
  avgLoad: number | null;
  acwr: number | null;
  totalSessions: number;
}

export async function getAthleteReportData(athleteId: string, fromDate?: string, toDate?: string): Promise<AthleteReportData> {
  const supabase = createClient();

  const [athleteRes, wellnessRes, trainingRes, injuriesRes] = await Promise.all([
    supabase.from("athletes").select("*").eq("id", athleteId).single(),
    supabase.from("wellness_entries").select("*")
      .eq("athlete_id", athleteId)
      .gte("submitted_at", fromDate ?? "2000-01-01")
      .lte("submitted_at", toDate ?? "2099-12-31")
      .order("submitted_at", { ascending: false }),
    supabase.from("training_entries").select("*")
      .eq("athlete_id", athleteId)
      .gte("training_date", fromDate ?? "2000-01-01")
      .lte("training_date", toDate ?? "2099-12-31")
      .order("training_date", { ascending: false }),
    supabase.from("injuries").select("*")
      .eq("athlete_id", athleteId)
      .order("injury_date", { ascending: false }),
  ]);

  handleError(athleteRes.error, "reports.getAthleteReportData.athlete");
  handleError(wellnessRes.error, "reports.getAthleteReportData.wellness");
  handleError(trainingRes.error, "reports.getAthleteReportData.training");
  handleError(injuriesRes.error, "reports.getAthleteReportData.injuries");

  const wellness = wellnessRes.data ?? [];
  const training = trainingRes.data ?? [];

  const avgWellness = wellness.length > 0
    ? Math.round((wellness.reduce((s, w) => s + (w.wellness_score ?? 0), 0) / wellness.length) * 10) / 10
    : null;
  const avgLoad = training.length > 0
    ? Math.round((training.reduce((s, t) => s + t.load_score, 0) / training.length) * 10) / 10
    : null;

  let acwr: number | null = null;
  if (training.length >= 7) {
    const recent7 = training.slice(0, 7).reduce((s, t) => s + t.load_score, 0) / 7;
    const recent28 = training.slice(0, 28).reduce((s, t) => s + t.load_score, 0) / 28;
    if (recent28 > 0) acwr = Math.round((recent7 / recent28) * 100) / 100;
  }

  return {
    athlete: athleteRes.data,
    wellnessEntries: wellness,
    trainingEntries: training,
    injuries: injuriesRes.data ?? [],
    avgWellness,
    avgLoad,
    acwr,
    totalSessions: training.length,
  };
}

export interface TeamReportData {
  athletes: Athlete[];
  allInjuries: (InjuryRecord & { athlete_name?: string })[];
  totalAthletes: number;
  activeInjuries: number;
  avgWellness: number | null;
  avgAcwr: number | null;
  recoveryRate: number | null;
}

export async function getTeamReportData(fromDate?: string, toDate?: string): Promise<TeamReportData> {
  const supabase = createClient();

  const { data: athletes, error: athletesError } = await supabase.from("athletes").select("*").order("full_name");
  handleError(athletesError, "reports.getTeamReportData.athletes");
  const { data: allInjuries, error: injuriesError } = await supabase.from("injuries").select("*").order("injury_date", { ascending: false });
  handleError(injuriesError, "reports.getTeamReportData.injuries");
  const nameMap = new Map((athletes ?? []).map((a) => [a.id, a.full_name]));
  const { data: wellnessData, error: wellnessError } = await supabase
    .from("wellness_entries")
    .select("wellness_score")
    .gte("submitted_at", fromDate ?? "2000-01-01")
    .lte("submitted_at", toDate ?? "2099-12-31");
  handleError(wellnessError, "reports.getTeamReportData.wellness");
  const { data: trainingData, error: trainingError } = await supabase
    .from("training_entries")
    .select("load_score, athlete_id, training_date")
    .gte("training_date", fromDate ?? "2000-01-01")
    .lte("training_date", toDate ?? "2099-12-31");
  handleError(trainingError, "reports.getTeamReportData.training");

  const injuries = allInjuries ?? [];

  const avgWellness = wellnessData && wellnessData.length > 0
    ? Math.round((wellnessData.reduce((s, w) => s + (w.wellness_score ?? 0), 0) / wellnessData.length) * 10) / 10
    : null;

  const athleteLoads = new Map<string, number[]>();
  (trainingData ?? []).forEach((t) => {
    if (!athleteLoads.has(t.athlete_id)) athleteLoads.set(t.athlete_id, []);
    athleteLoads.get(t.athlete_id)!.push(t.load_score);
  });

  let avgAcwr: number | null = null;
  const acwrs: number[] = [];
  for (const loads of athleteLoads.values()) {
    if (loads.length >= 7) {
      const acute = loads.slice(-7).reduce((a, b) => a + b, 0) / 7;
      const chronic = loads.slice(-28).reduce((a, b) => a + b, 0) / 28;
      if (chronic > 0) acwrs.push(acute / chronic);
    }
  }
  if (acwrs.length > 0) avgAcwr = Math.round((acwrs.reduce((a, b) => a + b, 0) / acwrs.length) * 100) / 100;

  const recovered = injuries.filter((i) => i.status === "recovered").length;
  const total = injuries.length;
  const recoveryRate = total > 0 ? Math.round((recovered / total) * 100) : null;

  return {
    athletes: athletes ?? [],
    allInjuries: injuries.map((i) => ({ ...i, athlete_name: nameMap.get(i.athlete_id) ?? undefined })),
    totalAthletes: athletes?.length ?? 0,
    activeInjuries: injuries.filter((i) => i.status === "active").length,
    avgWellness,
    avgAcwr,
    recoveryRate,
  };
}

export interface InjuryReportData {
  injuries: InjuryRecord[];
  totalInjuries: number;
  byType: { name: string; count: number }[];
  byBodyPart: { name: string; count: number }[];
  bySeverity: { name: string; count: number }[];
  byMechanism: { name: string; count: number }[];
  avgRecoveryDays: number | null;
  avgEstRecoveryDays: number | null;
}

export async function getInjuryReportData(fromDate?: string, toDate?: string): Promise<InjuryReportData> {
  const supabase = createClient();
  const { data: injuries, error } = await supabase
    .from("injuries")
    .select("*")
    .order("injury_date", { ascending: false });

  const all = handleData<InjuryRecord>(injuries ?? [], error, "reports.getInjuryReportData");

  const byType = aggregateField(all, "injury_type");
  const byBodyPart = aggregateField(all, "body_part");
  const bySeverity = aggregateField(all, "severity");
  const byMechanism = aggregateField(all, "mechanism");

  const withActual = all.filter((i) => i.actual_recovery_days !== null);
  const avgRecoveryDays = withActual.length > 0
    ? Math.round(withActual.reduce((s, i) => s + (i.actual_recovery_days ?? 0), 0) / withActual.length)
    : null;
  const withEst = all.filter((i) => i.estimated_recovery_days !== null);
  const avgEstRecoveryDays = withEst.length > 0
    ? Math.round(withEst.reduce((s, i) => s + (i.estimated_recovery_days ?? 0), 0) / withEst.length)
    : null;

  return {
    injuries: all,
    totalInjuries: all.length,
    byType, byBodyPart, bySeverity, byMechanism,
    avgRecoveryDays, avgEstRecoveryDays,
  };
}

function aggregateField(data: object[], field: string): { name: string; count: number }[] {
  const map = new Map<string, number>();
  data.forEach((item) => {
    const val = String((item as Record<string, unknown>)[field] ?? "Unknown");
    map.set(val, (map.get(val) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export interface WellnessReportData {
  entries: WellnessEntry[];
  totalEntries: number;
  avgSleep: number | null;
  avgFatigue: number | null;
  avgSoreness: number | null;
  avgStress: number | null;
  avgMood: number | null;
  avgRecovery: number | null;
  avgWellness: number | null;
  lowWellnessDays: number;
}

export async function getWellnessReportData(athleteId: string, fromDate?: string, toDate?: string): Promise<WellnessReportData> {
  const supabase = createClient();
  const { data: entries, error } = await supabase
    .from("wellness_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("submitted_at", fromDate ?? "2000-01-01")
    .lte("submitted_at", toDate ?? "2099-12-31")
    .order("submitted_at", { ascending: false });

  const all = handleData<WellnessEntry>(entries ?? [], error, "reports.getWellnessReportData");

  const avg = (key: keyof WellnessEntry) => {
    const vals = all.map((e) => e[key] as number).filter((v) => v !== null && v !== undefined);
    return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };

  return {
    entries: all,
    totalEntries: all.length,
    avgSleep: avg("sleep_quality"),
    avgFatigue: avg("fatigue"),
    avgSoreness: avg("muscle_soreness"),
    avgStress: avg("stress_level"),
    avgMood: avg("mood_state"),
    avgRecovery: avg("recovery_feeling"),
    avgWellness: avg("wellness_score"),
    lowWellnessDays: all.filter((e) => (e.wellness_score ?? 0) < 60).length,
  };
}

export interface TrainingReportData {
  entries: TrainingEntry[];
  totalSessions: number;
  totalLoad: number;
  avgDuration: number | null;
  avgIntensity: number | null;
  avgLoad: number | null;
  acwr: number | null;
  byType: { training_type: string; count: number; total_load: number }[];
}

export async function getTrainingReportData(athleteId: string, fromDate?: string, toDate?: string): Promise<TrainingReportData> {
  const supabase = createClient();
  const { data: entries, error } = await supabase
    .from("training_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("training_date", fromDate ?? "2000-01-01")
    .lte("training_date", toDate ?? "2099-12-31")
    .order("training_date", { ascending: false });

  const all = handleData<TrainingEntry>(entries ?? [], error, "reports.getTrainingReportData");
  const totalLoad = all.reduce((s, t) => s + t.load_score, 0);
  const avgDuration = all.length > 0 ? Math.round(all.reduce((s, t) => s + t.duration_minutes, 0) / all.length) : null;
  const avgIntensity = all.length > 0 ? Math.round((all.reduce((s, t) => s + t.intensity_rpe, 0) / all.length) * 10) / 10 : null;
  const avgLoad = all.length > 0 ? Math.round((totalLoad / all.length) * 10) / 10 : null;

  let acwr: number | null = null;
  if (all.length >= 7) {
    const sorted = [...all].sort((a, b) => b.training_date.localeCompare(a.training_date));
    const acute = sorted.slice(0, 7).reduce((s, t) => s + t.load_score, 0) / 7;
    const chronic = sorted.slice(0, 28).reduce((s, t) => s + t.load_score, 0) / 28;
    if (chronic > 0) acwr = Math.round((acute / chronic) * 100) / 100;
  }

  const typeMap = new Map<string, { count: number; total_load: number }>();
  all.forEach((t) => {
    const existing = typeMap.get(t.training_type) ?? { count: 0, total_load: 0 };
    existing.count++;
    existing.total_load += t.load_score;
    typeMap.set(t.training_type, existing);
  });

  return {
    entries: all,
    totalSessions: all.length,
    totalLoad,
    avgDuration, avgIntensity, avgLoad, acwr,
    byType: Array.from(typeMap.entries()).map(([type, data]) => ({
      training_type: type,
      count: data.count,
      total_load: Math.round(data.total_load),
    })).sort((a, b) => b.count - a.count),
  };
}
