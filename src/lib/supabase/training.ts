"use client";

import { createClient } from "@/lib/supabase/client";
import type { TrainingEntry, TrainingType, TrainingSummary, AcwrDataPoint, AcwrAlert } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

function calculateLoadScore(duration: number, intensity: number): number {
  return duration * intensity;
}

export async function getTrainingEntries(athleteId: string): Promise<TrainingEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("training_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("training_date", { ascending: false });
  return handleData<TrainingEntry>(data, error, "training.get-all");
}

export async function getTodayTraining(athleteId: string): Promise<TrainingEntry | null> {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("training_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .eq("training_date", today)
    .single();
  return handleSingle<TrainingEntry>(data, error, "training.get-today");
}

export async function submitTraining(
  athleteId: string,
  values: {
    training_date: string;
    training_type: TrainingType;
    duration_minutes: number;
    intensity_rpe: number;
    notes?: string;
  }
): Promise<TrainingEntry | null> {
  const supabase = createClient();
  const loadScore = calculateLoadScore(values.duration_minutes, values.intensity_rpe);
  const { data, error } = await supabase
    .from("training_entries")
    .insert({
      athlete_id: athleteId,
      training_date: values.training_date,
      training_type: values.training_type,
      duration_minutes: values.duration_minutes,
      intensity_rpe: values.intensity_rpe,
      load_score: loadScore,
      notes: values.notes ?? null,
    })
    .select()
    .single();
  return handleSingle<TrainingEntry>(data, error, "training.submit");
}

export async function deleteTraining(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("training_entries").delete().eq("id", id);
  handleError(error, "training.delete");
}

export async function getTrainingTrend(athleteId: string, days = 30): Promise<{ date: string; load_score: number; duration: number; intensity: number }[]> {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("training_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("training_date", since.toISOString().split("T")[0])
    .order("training_date", { ascending: true });
  const entries = handleData<TrainingEntry>(data, error, "training.get-trend");
  return entries.map((e) => ({
    date: new Date(e.training_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    load_score: e.load_score,
    duration: e.duration_minutes,
    intensity: e.intensity_rpe,
  }));
}

export async function getTrainingSummary(athleteId: string): Promise<TrainingSummary> {
  const supabase = createClient();
  const entries = await getTrainingEntries(athleteId);

  const totalSessions = entries.length;
  if (totalSessions === 0) {
    return { total_sessions: 0, total_load: 0, avg_intensity: 0, avg_duration: 0, daily_load: 0, weekly_load: 0, monthly_load: 0, acute_load: 0, chronic_load: 0, acwr: 0 };
  }

  const totalLoad = entries.reduce((s, e) => s + e.load_score, 0);
  const avgIntensity = Math.round(entries.reduce((s, e) => s + e.intensity_rpe, 0) / totalSessions * 10) / 10;
  const avgDuration = Math.round(entries.reduce((s, e) => s + e.duration_minutes, 0) / totalSessions);

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 28 * 86400000);

  const dailyLoad = entries
    .filter((e) => e.training_date === today)
    .reduce((s, e) => s + e.load_score, 0);

  const weeklyLoad = entries
    .filter((e) => new Date(e.training_date) >= weekAgo)
    .reduce((s, e) => s + e.load_score, 0);

  const monthlyLoad = entries
    .filter((e) => new Date(e.training_date) >= monthAgo)
    .reduce((s, e) => s + e.load_score, 0);

  const acuteLoad = weeklyLoad / 7;
  const chronicLoad = entries
    .filter((e) => new Date(e.training_date) >= monthAgo)
    .reduce((s, e) => s + e.load_score, 0) / 28;

  const acwr = chronicLoad > 0 ? Math.round((acuteLoad / chronicLoad) * 100) / 100 : 0;

  return {
    total_sessions: totalSessions,
    total_load: totalLoad,
    avg_intensity: avgIntensity,
    avg_duration: avgDuration,
    daily_load: dailyLoad,
    weekly_load: weeklyLoad,
    monthly_load: monthlyLoad,
    acute_load: Math.round(acuteLoad * 10) / 10,
    chronic_load: Math.round(chronicLoad * 10) / 10,
    acwr,
  };
}

export async function getAcwrTrend(athleteId: string, days = 60): Promise<AcwrDataPoint[]> {
  const supabase = createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("training_entries")
    .select("*")
    .eq("athlete_id", athleteId)
    .gte("training_date", since.toISOString().split("T")[0])
    .order("training_date", { ascending: true });
  const entries = handleData<TrainingEntry>(data, error, "training.get-acwr-trend");

  const points: AcwrDataPoint[] = [];
  const dayMap = new Map<string, number>();
  for (const e of entries) {
    dayMap.set(e.training_date, (dayMap.get(e.training_date) ?? 0) + e.load_score);
  }

  const sortedDates = [...dayMap.keys()].sort();
  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const acuteStart = new Date(currentDate.getTime() - 6 * 86400000);
    const chronicStart = new Date(currentDate.getTime() - 27 * 86400000);

    let acuteSum = 0;
    let chronicSum = 0;
    for (const [dateStr, load] of dayMap) {
      const d = new Date(dateStr);
      if (d >= acuteStart && d <= currentDate) acuteSum += load;
      if (d >= chronicStart && d <= currentDate) chronicSum += load;
    }

    const acuteAvg = acuteSum / 7;
    const chronicAvg = chronicSum / 28;
    const acwr = chronicAvg > 0 ? Math.round((acuteAvg / chronicAvg) * 100) / 100 : 0;

    let risk_zone: "low" | "optimal" | "high" | "very_high";
    if (acwr < 0.8) risk_zone = "low";
    else if (acwr <= 1.3) risk_zone = "optimal";
    else if (acwr <= 1.5) risk_zone = "high";
    else risk_zone = "very_high";

    points.push({
      date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      acute_load: Math.round(acuteAvg * 10) / 10,
      chronic_load: Math.round(chronicAvg * 10) / 10,
      acwr,
      risk_zone,
    });
  }

  return points;
}

export function getAcwrInsights(points: AcwrDataPoint[]): string[] {
  if (points.length < 7) return ["Not enough data to generate insights. Need at least 7 days."];

  const latest = points[points.length - 1];
  const insights: string[] = [];

  if (latest.risk_zone === "low") {
    insights.push("ACWR is below 0.8 — athlete may be undertraining. Consider increasing load gradually.");
  } else if (latest.risk_zone === "optimal") {
    insights.push("ACWR is in the optimal zone (0.8–1.3). Training load is well managed.");
  } else if (latest.risk_zone === "high") {
    insights.push("ACWR is elevated (1.3–1.5). Monitor closely — increased injury risk.");
  } else {
    insights.push("ACWR is very high (>1.5). High injury risk — consider reducing training load or adding recovery days.");
  }

  const last7 = points.slice(-7);
  const trend = last7.filter(p => p.acwr > 1.3).length;
  if (trend >= 4) {
    insights.push(`Warning: ${trend} of the last 7 days have been in the high-risk zone.`);
  }

  const spikeDays = points.filter(p => p.acwr > 1.5).length;
  if (spikeDays > 0) {
    insights.push(`${spikeDays} day(s) recorded with ACWR above 1.5. Review training schedule.`);
  }

  const recentAvg = last7.reduce((s, p) => s + p.acwr, 0) / last7.length;
  if (recentAvg >= 1.0 && latest.acwr > recentAvg) {
    insights.push("ACWR is trending upward. Keep monitoring daily.");
  } else if (recentAvg > 0 && latest.acwr < recentAvg) {
    insights.push("ACWR is trending downward — load is being managed effectively.");
  }

  return insights;
}

export function getAcwrAlerts(points: AcwrDataPoint[]): AcwrAlert[] {
  if (points.length < 7) return [];

  const alerts: AcwrAlert[] = [];
  const latest = points[points.length - 1];

  if (latest.risk_zone === "low") {
    alerts.push({
      id: "undertraining",
      severity: "warning",
      title: "Undertraining Risk",
      message: `ACWR is ${latest.acwr} — below 0.8. Athlete may be undertraining. Consider gradually increasing load by 10-20% per week.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  } else if (latest.risk_zone === "optimal") {
    alerts.push({
      id: "optimal",
      severity: "info",
      title: "Optimal Training Load",
      message: `ACWR is ${latest.acwr} — in the optimal zone (0.8–1.3). Training load is well balanced.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  } else if (latest.risk_zone === "high") {
    alerts.push({
      id: "elevated_risk",
      severity: "warning",
      title: "Elevated Injury Risk",
      message: `ACWR is ${latest.acwr} — in the elevated zone (1.3–1.5). Monitor closely. Consider adding recovery days or reducing intensity.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  } else {
    alerts.push({
      id: "high_risk",
      severity: "danger",
      title: "High Injury Risk",
      message: `ACWR is ${latest.acwr} — above 1.5. Immediate intervention needed. Reduce training load significantly and prioritize recovery.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  }

  const spikeDays = points.filter(p => p.risk_zone === "very_high").length;
  if (spikeDays >= 3) {
    alerts.push({
      id: "spike_frequency",
      severity: "danger",
      title: "Frequent High-Risk Days",
      message: `${spikeDays} days recorded with ACWR above 1.5 in the last ${points.length} days. Review training periodization.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  }

  const upwardTrend = points.slice(-7).filter(p => p.risk_zone === "high" || p.risk_zone === "very_high").length;
  if (upwardTrend >= 4 && latest.risk_zone !== "optimal") {
    alerts.push({
      id: "upward_trend",
      severity: "warning",
      title: "Sustained High Load",
      message: `${upwardTrend} of the last 7 days are in elevated or high-risk zones. Risk of injury is accumulating.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  }

  const suddenSpike = points.length >= 2 && points[points.length - 1].acwr > points[points.length - 2].acwr * 1.3;
  if (suddenSpike && latest.risk_zone !== "optimal") {
    alerts.push({
      id: "sudden_spike",
      severity: "warning",
      title: "Sudden Load Spike",
      message: `ACWR jumped ${((latest.acwr / points[points.length - 2].acwr - 1) * 100).toFixed(0)}% from previous day. Rapid increases in training load increase injury risk.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  }

  const chronicBelow = latest.chronic_load < 100;
  if (chronicBelow && latest.risk_zone !== "low") {
    alerts.push({
      id: "low_chronic_base",
      severity: "info",
      title: "Low Chronic Load Base",
      message: `Chronic load is ${latest.chronic_load} — relatively low. ACWR may be sensitive to small changes in training volume.`,
      date: latest.date,
      acwr_value: latest.acwr,
    });
  }

  return alerts;
}

export { calculateLoadScore };
