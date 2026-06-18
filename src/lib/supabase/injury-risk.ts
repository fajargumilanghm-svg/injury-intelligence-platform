"use client";

import { createClient } from "@/lib/supabase/client";
import type { WellnessEntry, TrainingEntry } from "@/types";

export interface InjuryRiskResult {
  overall_risk: number;
  risk_level: "low" | "moderate" | "high";
  factors: {
    label: string;
    score: number;
    weight: number;
    contribution: number;
    detail: string;
  }[];
  breakdown: {
    label: string;
    raw: number;
    normalized: number;
  }[];
}

function getRiskLevel(score: number): "low" | "moderate" | "high" {
  if (score <= 39) return "low";
  if (score <= 69) return "moderate";
  return "high";
}

function normalizeAcwrLoad(acwr: number): number {
  if (acwr >= 0.8 && acwr <= 1.3) return 0;
  if (acwr < 0.8) return ((0.8 - acwr) / 0.8) * 50;
  if (acwr <= 1.5) return ((acwr - 1.3) / 0.2) * 50 + 30;
  return Math.min(((acwr - 1.5) / 0.5) * 50 + 80, 100);
}

const WEIGHTS = {
  training_load: 0.30,
  fatigue: 0.20,
  sleep_quality: 0.15,
  muscle_soreness: 0.15,
  injury_history: 0.10,
  flexibility: 0.10,
};

export async function calculateInjuryRisk(
  athleteId: string
): Promise<InjuryRiskResult | null> {
  const supabase = createClient();

  const [wellnessData, trainingData, athleteData] = await Promise.all([
    supabase
      .from("wellness_entries")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("submitted_at", { ascending: false })
      .limit(7),
    supabase
      .from("training_entries")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("training_date", { ascending: false }),
    supabase
      .from("athletes")
      .select("*")
      .eq("id", athleteId)
      .single(),
  ]);

  const wellness: WellnessEntry[] = wellnessData.data ?? [];
  const training: TrainingEntry[] = trainingData.data ?? [];
  const athlete = athleteData.data;

  if (training.length === 0 && wellness.length === 0) return null;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 28 * 86400000);

  const recentTraining = training.filter((e) => new Date(e.training_date) >= weekAgo);
  const chronicEntries = training.filter((e) => new Date(e.training_date) >= monthAgo);
  const acuteLoad = recentTraining.reduce((s, e) => s + e.load_score, 0) / 7;
  const chronicLoad = chronicEntries.reduce((s, e) => s + e.load_score, 0) / 28;
  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

  const trainingLoadRisk = normalizeAcwrLoad(acwr);

  const avgFatigue = wellness.length > 0
    ? wellness.reduce((s, e) => s + e.fatigue, 0) / wellness.length
    : 5.5;
  const fatigueRisk = ((avgFatigue - 1) / 9) * 100;

  const avgSleep = wellness.length > 0
    ? wellness.reduce((s, e) => s + e.sleep_quality, 0) / wellness.length
    : 5.5;
  const sleepRisk = ((10 - avgSleep) / 9) * 100;

  const avgSoreness = wellness.length > 0
    ? wellness.reduce((s, e) => s + e.muscle_soreness, 0) / wellness.length
    : 5.5;
  const sorenessRisk = ((avgSoreness - 1) / 9) * 100;

  const hasInjuryHistory = athlete?.previous_injury_history && athlete.previous_injury_history.trim().length > 0;
  const hasRecentSymptoms = wellness.length > 0
    && wellness.slice(0, 3).some((e) => e.muscle_soreness >= 7 || e.fatigue >= 8);
  const injuryRisk = hasInjuryHistory
    ? (hasRecentSymptoms ? 85 : 55)
    : (hasRecentSymptoms ? 40 : 5);

  const avgRecovery = wellness.length > 0
    ? wellness.reduce((s, e) => s + e.recovery_feeling, 0) / wellness.length
    : 5.5;
  const flexibilityRisk = ((10 - avgRecovery) / 9) * 100;

  const rawScores = [
    { label: "Training Load", raw: trainingLoadRisk },
    { label: "Fatigue", raw: fatigueRisk },
    { label: "Sleep Quality", raw: sleepRisk },
    { label: "Muscle Soreness", raw: sorenessRisk },
    { label: "Injury History", raw: injuryRisk },
    { label: "Flexibility Score", raw: flexibilityRisk },
  ];

  const weightedScores = rawScores.map((s, i) => {
    const weight = Object.values(WEIGHTS)[i];
    return { ...s, weight, contribution: Math.round(s.raw * weight) };
  });

  const overallRisk = Math.min(100, Math.max(0,
    Math.round(weightedScores.reduce((sum, s) => sum + s.contribution, 0))
  ));

  const factors = weightedScores.map((s) => ({
    label: s.label,
    score: Math.round(s.raw),
    weight: s.weight,
    contribution: s.contribution,
    detail: getFactorDetail(s.label, s.raw, acwr, athlete, wellness),
  }));

  const breakdown = rawScores.map((s) => ({
    label: s.label,
    raw: Math.round(s.raw * 10) / 10,
    normalized: Math.round(s.raw),
  }));

  return {
    overall_risk: overallRisk,
    risk_level: getRiskLevel(overallRisk),
    factors,
    breakdown,
  };
}

function getFactorDetail(
  label: string,
  score: number,
  acwr: number,
  athlete: { previous_injury_history?: string | null } | null,
  wellness: WellnessEntry[]
): string {
  switch (label) {
    case "Training Load":
      if (acwr >= 0.8 && acwr <= 1.3) return `ACWR ${acwr.toFixed(2)} — optimal zone`;
      if (acwr < 0.8) return `ACWR ${acwr.toFixed(2)} — undertraining`;
      return `ACWR ${acwr.toFixed(2)} — elevated`;
    case "Fatigue": {
      const avg = wellness.length > 0 ? (wellness.reduce((s, e) => s + e.fatigue, 0) / wellness.length).toFixed(1) : "N/A";
      return `Avg fatigue ${avg}/10`;
    }
    case "Sleep Quality": {
      const avg = wellness.length > 0 ? (wellness.reduce((s, e) => s + e.sleep_quality, 0) / wellness.length).toFixed(1) : "N/A";
      return `Avg sleep ${avg}/10`;
    }
    case "Muscle Soreness": {
      const avg = wellness.length > 0 ? (wellness.reduce((s, e) => s + e.muscle_soreness, 0) / wellness.length).toFixed(1) : "N/A";
      return `Avg soreness ${avg}/10`;
    }
    case "Injury History":
      if (athlete?.previous_injury_history && athlete.previous_injury_history.trim().length > 0) {
        return `Previous injury recorded`;
      }
      return "No previous injury history";
    case "Flexibility Score": {
      const avg = wellness.length > 0 ? (wellness.reduce((s, e) => s + e.recovery_feeling, 0) / wellness.length).toFixed(1) : "N/A";
      return `Avg recovery ${avg}/10`;
    }
    default:
      return "";
  }
}
