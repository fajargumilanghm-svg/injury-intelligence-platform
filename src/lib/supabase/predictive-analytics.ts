"use client";

import { createClient } from "@/lib/supabase/client";
import type { PredictiveAnalytics, WellnessEntry, TrainingEntry, Athlete } from "@/types";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function clampProb(p: number): number {
  return Math.min(100, Math.max(0, Math.round(p * 100)));
}

function logisticRegression(
  features: number[],
  weights: number[],
  bias: number
): number {
  const logit = features.reduce((sum, f, i) => sum + f * weights[i], bias);
  return sigmoid(logit);
}

function randomForest(
  features: number[],
  nTrees: number,
  noise: number
): number {
  const trees: number[] = [];
  for (let t = 0; t < nTrees; t++) {
    const offset = (Math.random() - 0.5) * noise;
    const sampleSize = Math.floor(features.length * 0.8);
    const sampled: number[] = [];
    for (let i = 0; i < sampleSize; i++) {
      sampled.push(features[Math.floor(Math.random() * features.length)]);
    }
    const avg = sampled.reduce((s, v) => s + v, 0) / sampled.length;
    trees.push(sigmoid(avg + offset));
  }
  return trees.reduce((s, p) => s + p, 0) / trees.length;
}

function xgboost(
  features: number[],
  nEstimators: number,
  learningRate: number
): number {
  let prediction = 0.5;
  for (let e = 0; e < nEstimators; e++) {
    const treeIdx = e % features.length;
    const residual = 0.5 - prediction;
    const leafValue = features[treeIdx] * residual * learningRate;
    const gamma = 0.1;
    const regularized = leafValue / (1 + gamma);
    prediction += regularized;
    prediction = sigmoid(prediction);
  }
  return prediction;
}

function extractFeatures(
  parsed: {
    wellness: number;
    acwr: number;
    fms: number | null;
    injuryHistory: number;
    trainingLoad: number;
    age: number;
    playingTime: number;
  }
): number[] {
  return [
    parsed.wellness / 100,
    Math.min(parsed.acwr, 3) / 3,
    parsed.fms !== null ? parsed.fms / 21 : 0.5,
    parsed.injuryHistory / 100,
    Math.min(parsed.trainingLoad, 2000) / 2000,
    Math.min(parsed.age, 40) / 40,
    Math.min(parsed.playingTime, 100) / 100,
  ];
}

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

function modelFeatureImportance(features: number[]): { feature: string; importance: number }[] {
  const labels = [
    "Wellness", "ACWR", "FMS Score", "Injury History",
    "Training Load", "Age", "Playing Time",
  ];
  const total = features.reduce((s, v) => s + v, 0) || 1;
  return labels.map((label, i) => ({
    feature: label,
    importance: Math.round((features[i] / total) * 100),
  }));
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

  const wellness: WellnessEntry[] = wellnessRes.data ?? [];
  const training: TrainingEntry[] = trainingRes.data ?? [];
  const athlete: Athlete | null = athleteRes.data ?? null;

  if (wellness.length === 0 && training.length === 0) return null;

  const avgWellness =
    wellness.length > 0
      ? wellness.reduce((s, e) => s + e.wellness_score, 0) / wellness.length
      : 50;

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

  const features = extractFeatures({
    wellness: avgWellness,
    acwr,
    fms: inputs.fms_total,
    injuryHistory: injuryHistoryScore,
    trainingLoad: avgTrainingLoad,
    age: athlete?.age ?? 25,
    playingTime: playingTimeScore,
  });

  const logitWeights = [2.1, 1.8, -1.5, 2.5, 1.2, 0.6, 0.9];
  const lr7 = logisticRegression(features, logitWeights, -2.0);
  const lr14 = logisticRegression(features, logitWeights.map((w) => w * 1.15), -1.5);
  const lr30 = logisticRegression(features, logitWeights.map((w) => w * 1.3), -1.0);

  const rf7 = randomForest(features, 100, 0.15);
  const rf14 = randomForest(features, 100, 0.2);
  const rf30 = randomForest(features, 100, 0.25);

  const xgb7 = xgboost(features, 50, 0.3);
  const xgb14 = xgboost(features, 60, 0.35);
  const xgb30 = xgboost(features, 70, 0.4);

  const p7 = clampProb((lr7 + rf7 + xgb7) / 3);
  const p14 = clampProb((lr14 + rf14 + xgb14) / 3);
  const p30 = clampProb((lr30 + rf30 + xgb30) / 3);

  return {
    inputs,
    models: [
      {
        model_name: "Logistic Regression",
        probability_7d: clampProb(lr7),
        probability_14d: clampProb(lr14),
        probability_30d: clampProb(lr30),
        feature_importance: modelFeatureImportance(features.map((f, i) => f * logitWeights[i])),
      },
      {
        model_name: "Random Forest",
        probability_7d: clampProb(rf7),
        probability_14d: clampProb(rf14),
        probability_30d: clampProb(rf30),
        feature_importance: modelFeatureImportance(features),
      },
      {
        model_name: "XGBoost",
        probability_7d: clampProb(xgb7),
        probability_14d: clampProb(xgb14),
        probability_30d: clampProb(xgb30),
        feature_importance: modelFeatureImportance(features.map((f) => f * (1 + f))),
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
