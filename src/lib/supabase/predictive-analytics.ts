"use client";

import { createClient } from "@/lib/supabase/client";
import { handleData, handleSingle, handleError } from "./helpers";
import type { PredictiveAnalytics, WellnessEntry, TrainingEntry, Athlete } from "@/types";

function computeInjuryHistoryScore(
  athlete: Athlete | null,
  wellness: WellnessEntry[]
): number {
  if (!athlete) return 10;
  let score = 0;
  if (athlete.previous_injury_history && athlete.previous_injury_history.trim().length > 0) {
    score += 50;
    const severityKeywords = ["severe", "fracture", "acl", "surgery", "chronic", "recurrent", "stress"];
    const matches = severityKeywords.filter((k) =>
      athlete.previous_injury_history!.toLowerCase().includes(k)
    );
    score += matches.length * 8;
  }
  const recentSymptoms = wellness.slice(0, 7).filter(
    (e) => e.muscle_soreness >= 7 || e.fatigue >= 8
  );
  score += recentSymptoms.length * 5;
  return Math.min(100, score);
}

function computePlayingTimeScore(athlete: Athlete | null): number {
  if (!athlete || !athlete.playing_position) return 50;
  const highLoadPositions = [
    "forward", "striker", "center back", "linebacker",
    "prop", "flanker", "point guard", "small forward",
    "midfielder", "winger",
  ];
  const pos = athlete.playing_position.toLowerCase();
  const match = highLoadPositions.some((p) => pos.includes(p));
  return match ? 70 : 40;
}

function computeRiskLevel(p: number): "low" | "moderate" | "high" | "very_high" {
  if (p < 20) return "low";
  if (p < 45) return "moderate";
  if (p < 70) return "high";
  return "very_high";
}

function calculateRiskScore(athlete: {
  fatigue?: number;
  sleep_quality?: number;
  acute_chronic_ratio?: number;
  training_load_trend?: number;
  recent_injury_severity?: number;
}): number {
  const fatigue = athlete.fatigue ?? 5;
  const sleep = athlete.sleep_quality ?? 5;
  const acwr = athlete.acute_chronic_ratio ?? 1.0;
  const trend = athlete.training_load_trend ?? 0;
  const injuryPenalty = athlete.recent_injury_severity ?? 0;

  let score = 0;
  score += (fatigue / 10) * 25;
  score += ((10 - sleep) / 10) * 20;
  score += Math.max(0, (acwr - 1.0) / 1.5) * 30;
  score += Math.max(0, trend / 100) * 10;
  score += (injuryPenalty / 5) * 15;

  return Math.round(Math.min(99, Math.max(1, score)));
}

function getFeatureImportance(): Array<{ feature: string; importance: number }> {
  return [
    { feature: "Acute:Chronic Ratio", importance: 30 },
    { feature: "Fatigue Level", importance: 25 },
    { feature: "Sleep Quality", importance: 20 },
    { feature: "Recent Injury Severity", importance: 15 },
    { feature: "Training Load Trend", importance: 10 },
  ];
}

export async function getPredictiveAnalytics(
  athleteId: string
): Promise<PredictiveAnalytics | null> {
  const supabase = createClient();

  const [wellnessRes, trainingRes, athleteRes] = await Promise.all([
    supabase
      .from("wellness_entries")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("submitted_at", { ascending: false })
      .limit(14),
    supabase
      .from("training_entries")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("training_date", { ascending: false })
      .limit(30),
    supabase
      .from("athletes")
      .select("*")
      .eq("id", athleteId)
      .single(),
  ]);

  handleError(wellnessRes.error, "getPredictiveAnalytics:wellness");
  handleError(trainingRes.error, "getPredictiveAnalytics:training");
  handleError(athleteRes.error, "getPredictiveAnalytics:athlete");

  const wellness: WellnessEntry[] = handleData<WellnessEntry>(wellnessRes.data, null, "getPredictiveAnalytics:wellness");
  const training: TrainingEntry[] = handleData<TrainingEntry>(trainingRes.data, null, "getPredictiveAnalytics:training");
  const athlete: Athlete | null = handleSingle<Athlete>(athleteRes.data, null, "getPredictiveAnalytics:athlete");

  if (wellness.length === 0 && training.length === 0) return null;

  const avgWellness =
    wellness.length > 0
      ? wellness.reduce((s, e) => s + e.wellness_score, 0) / wellness.length
      : 50;

  const avgFatigue =
    wellness.length > 0
      ? wellness.reduce((s, e) => s + e.fatigue, 0) / wellness.length
      : 5;

  const avgSleep =
    wellness.length > 0
      ? wellness.reduce((s, e) => s + e.sleep_quality, 0) / wellness.length
      : 5;

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const monthAgo = new Date(Date.now() - 28 * 86400000);
  const recentTraining = training.filter((e) => new Date(e.training_date) >= weekAgo);
  const chronicEntries = training.filter((e) => new Date(e.training_date) >= monthAgo);
  const acuteLoad = recentTraining.length > 0
    ? recentTraining.reduce((s, e) => s + e.load_score, 0) / 7
    : 0;
  const chronicLoad = chronicEntries.length > 0
    ? chronicEntries.reduce((s, e) => s + e.load_score, 0) / 28
    : 1;
  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 0;

  const avgTrainingLoad =
    training.length > 0
      ? training.reduce((s, e) => s + e.load_score, 0) / training.length
      : 0;

  const injuryHistoryScore = computeInjuryHistoryScore(athlete, wellness);
  const playingTimeScore = computePlayingTimeScore(athlete);

  const inputs = {
    wellness_score: Math.round(avgWellness),
    acwr: Math.round(acwr * 100) / 100,
    fms_total: null as number | null,
    injury_history_score: injuryHistoryScore,
    training_load: Math.round(avgTrainingLoad),
    age: athlete?.age ?? 25,
    playing_time_score: playingTimeScore,
  };

  const riskScore = calculateRiskScore({
    fatigue: Math.round(avgFatigue),
    sleep_quality: Math.round(avgSleep),
    acute_chronic_ratio: acwr,
    training_load_trend: avgTrainingLoad,
    recent_injury_severity: injuryHistoryScore,
  });

  const p7 = Math.round(Math.min(99, Math.max(1, riskScore)));
  const p14 = Math.round(Math.min(99, Math.max(1, riskScore * 1.1)));
  const p30 = Math.round(Math.min(99, Math.max(1, riskScore * 1.2)));

  return {
    inputs,
    models: [
      {
        model_name: "Risk Analysis",
        probability_7d: p7,
        probability_14d: p14,
        probability_30d: p30,
        feature_importance: getFeatureImportance(),
      },
    ],
    ensemble: {
      probability_7d: p7,
      probability_14d: p14,
      probability_30d: p30,
      risk_level_7d: computeRiskLevel(p7),
      risk_level_14d: computeRiskLevel(p14),
      risk_level_30d: computeRiskLevel(p30),
    },
  };
}
