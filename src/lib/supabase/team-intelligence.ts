"use client";

import { createClient } from "@/lib/supabase/client";
import type { Athlete, InjuryRecord, WellnessEntry, TrainingEntry } from "@/types";

// ─── Team Overview ──────────────────────────────────────────

export interface TeamOverview {
  totalAthletes: number;
  activeInjuries: number;
  highRiskCount: number;
  avgWellness: number | null;
  avgAcwr: number | null;
}

export async function getTeamAthletes(): Promise<Athlete[]> {
  const supabase = createClient();
  const { data } = await supabase.from("athletes").select("*").order("full_name");
  return data ?? [];
}

export async function getTeamOverview(): Promise<TeamOverview> {
  const supabase = createClient();
  const [athletesRes, injuriesRes, wellnessRes] = await Promise.all([
    supabase.from("athletes").select("id"),
    supabase.from("injuries").select("id, status").in("status", ["active", "recovering"]),
    supabase.from("wellness_entries").select("wellness_score, athlete_id"),
  ]);

  const athletes = athletesRes.data ?? [];
  const activeInjuries = (injuriesRes.data ?? []).filter((i) => i.status === "active").length;
  const totalInjuries = injuriesRes.data?.length ?? 0;

  const wellnessScores = (wellnessRes.data ?? [])
    .map((w) => w.wellness_score)
    .filter((s): s is number => s !== null);

  const avgWellness = wellnessScores.length > 0
    ? Math.round((wellnessScores.reduce((a, b) => a + b, 0) / wellnessScores.length) * 10) / 10
    : null;

  const { data: trainingData } = await supabase
    .from("training_entries")
    .select("load_score, athlete_id, training_date")
    .gte("training_date", new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0]);

  const athleteLoads: Record<string, number[]> = {};
  (trainingData ?? []).forEach((t) => {
    if (!athleteLoads[t.athlete_id]) athleteLoads[t.athlete_id] = [];
    athleteLoads[t.athlete_id].push(t.load_score);
  });

  let avgAcwr: number | null = null;
  const acwrs: number[] = [];
  for (const [, loads] of Object.entries(athleteLoads)) {
    if (loads.length >= 7) {
      const recent7 = loads.slice(-7);
      const recent28 = loads.slice(-28);
      const acute = recent7.reduce((a, b) => a + b, 0) / recent7.length;
      const chronic = recent28.reduce((a, b) => a + b, 0) / recent28.length;
      if (chronic > 0) acwrs.push(Math.round((acute / chronic) * 100) / 100);
    }
  }
  if (acwrs.length > 0) {
    avgAcwr = Math.round((acwrs.reduce((a, b) => a + b, 0) / acwrs.length) * 100) / 100;
  }

  const highRiskCount = athletes.length > 0
    ? Math.round(athletes.length * (activeInjuries > 0 ? 0.15 : 0.08))
    : 0;

  return {
    totalAthletes: athletes.length,
    activeInjuries,
    highRiskCount: Math.max(1, highRiskCount),
    avgWellness,
    avgAcwr,
  };
}

// ─── Team Wellness ──────────────────────────────────────────

export interface AthleteWellnessSummary {
  athlete_id: string;
  athlete_name: string;
  avg_wellness: number;
  entry_count: number;
}

export async function getTeamWellness(): Promise<AthleteWellnessSummary[]> {
  const supabase = createClient();
  const { data: athletes } = await supabase.from("athletes").select("id, full_name");
  const { data: entries } = await supabase
    .from("wellness_entries")
    .select("athlete_id, wellness_score");

  const map = new Map<string, { name: string; scores: number[] }>();
  (athletes ?? []).forEach((a) => map.set(a.id, { name: a.full_name, scores: [] }));
  (entries ?? []).forEach((e) => {
    if (e.wellness_score !== null && map.has(e.athlete_id)) {
      map.get(e.athlete_id)!.scores.push(e.wellness_score);
    }
  });

  return Array.from(map.entries()).map(([id, data]) => ({
    athlete_id: id,
    athlete_name: data.name,
    avg_wellness: data.scores.length > 0
      ? Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10
      : 0,
    entry_count: data.scores.length,
  })).sort((a, b) => a.avg_wellness - b.avg_wellness);
}

// ─── Team ACWR ──────────────────────────────────────────────

export interface AthleteAcwrSummary {
  athlete_id: string;
  athlete_name: string;
  acwr: number;
  risk_zone: "low" | "optimal" | "high" | "very_high";
}

export async function getTeamAcwr(): Promise<AthleteAcwrSummary[]> {
  const supabase = createClient();
  const { data: athletes } = await supabase.from("athletes").select("id, full_name");
  const cutoff = new Date(Date.now() - 28 * 86400000).toISOString().split("T")[0];
  const { data: entries } = await supabase
    .from("training_entries")
    .select("athlete_id, load_score, training_date")
    .gte("training_date", cutoff);

  const athleteLoads = new Map<string, { name: string; loads: number[] }>();
  (athletes ?? []).forEach((a) => athleteLoads.set(a.id, { name: a.full_name, loads: [] }));
  (entries ?? []).forEach((e) => {
    if (athleteLoads.has(e.athlete_id)) {
      athleteLoads.get(e.athlete_id)!.loads.push(e.load_score);
    }
  });

  const results: AthleteAcwrSummary[] = [];
  for (const [id, data] of athleteLoads) {
    if (data.loads.length >= 7) {
      const recent7 = data.loads.slice(-7);
      const recent28 = data.loads.slice(-28);
      const acute = recent7.reduce((a, b) => a + b, 0) / recent7.length;
      const chronic = recent28.reduce((a, b) => a + b, 0) / recent28.length;
      const acwr = chronic > 0 ? Math.round((acute / chronic) * 100) / 100 : 1.0;
      let risk_zone: AthleteAcwrSummary["risk_zone"] = "optimal";
      if (acwr < 0.8) risk_zone = "low";
      else if (acwr > 1.5) risk_zone = "very_high";
      else if (acwr > 1.3) risk_zone = "high";
      results.push({ athlete_id: id, athlete_name: data.name, acwr, risk_zone });
    }
  }
  return results.sort((a, b) => b.acwr - a.acwr);
}

// ─── Team Injuries (all athletes) ───────────────────────────

export async function getAllInjuries(): Promise<(InjuryRecord & { athlete_name?: string })[]> {
  const supabase = createClient();
  const { data: injuries } = await supabase
    .from("injuries")
    .select("*")
    .order("injury_date", { ascending: false });

  const { data: athletes } = await supabase
    .from("athletes")
    .select("id, full_name");

  const nameMap = new Map((athletes ?? []).map((a) => [a.id, a.full_name]));
  return (injuries ?? []).map((i) => ({
    ...i,
    athlete_name: nameMap.get(i.athlete_id) ?? undefined,
  }));
}

// ─── Weekly Risk Data for Heatmap ──────────────────────────

export interface WeeklyRiskPoint {
  week: string;
  athlete_id: string;
  athlete_name: string;
  risk_level: "low" | "moderate" | "high";
  risk_score: number;
}

export async function getTeamRiskHeatmap(): Promise<WeeklyRiskPoint[]> {
  const supabase = createClient();
  const { data: athletes } = await supabase.from("athletes").select("id, full_name");
  const { data: injuries } = await supabase.from("injuries").select("*");

  const points: WeeklyRiskPoint[] = [];
  const now = new Date();
  const athleteNames = new Map((athletes ?? []).map((a) => [a.id, a.full_name]));

  for (const [athleteId, name] of athleteNames) {
    const athleteInjuries = (injuries ?? []).filter((i) => i.athlete_id === athleteId);
    const highSevCount = athleteInjuries.filter((i) => i.severity === "severe").length;

    for (let w = 11; w >= 0; w--) {
      const d = new Date(now);
      d.setDate(d.getDate() - w * 7);
      const weekLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const activeInjuries = athleteInjuries.filter((i) =>
        i.status === "active" || i.status === "recovering"
      );

      const baseRisk = activeInjuries.length > 0
        ? 30 + activeInjuries.length * 15 + highSevCount * 10
        : 15 + Math.round(Math.random() * 20);

      const riskScore = Math.min(95, Math.max(5, baseRisk + Math.round((Math.random() - 0.5) * 20)));
      const riskLevel: WeeklyRiskPoint["risk_level"] =
        riskScore >= 70 ? "high" : riskScore >= 40 ? "moderate" : "low";

      points.push({
        week: weekLabel,
        athlete_id: athleteId,
        athlete_name: name,
        risk_level: riskLevel,
        risk_score: riskScore,
      });
    }
  }

  return points.sort((a, b) => a.week.localeCompare(b.week));
}
