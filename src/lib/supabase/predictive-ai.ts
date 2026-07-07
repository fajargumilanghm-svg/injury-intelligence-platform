"use client";

import { createClient } from "@/lib/supabase/client";
import { handleData, handleSingle, handleError } from "./helpers";
import type { WellnessEntry, TrainingEntry } from "@/types";

export interface AIPrediction {
  risk_score: number;
  risk_level: "low" | "moderate" | "high" | "very_high";
  probability: number;
  confidence: "low" | "medium" | "high";
  factors: {
    label: string;
    value: number;
    impact: number;
    trend: "improving" | "stable" | "declining";
    recommendation: string;
  }[];
  weeklyProjection: {
    week: string;
    predictedRisk: number;
    lowerBound: number;
    upperBound: number;
  }[];
  insights: string[];
}

export async function predictInjuryRisk(athleteId: string): Promise<AIPrediction | null> {
  const supabase = createClient();

  const [wellnessRes, trainingRes, athleteRes] = await Promise.all([
    supabase.from("wellness_entries").select("*").eq("athlete_id", athleteId).order("submitted_at", { ascending: false }).limit(60),
    supabase.from("training_entries").select("*").eq("athlete_id", athleteId).order("training_date", { ascending: false }).limit(60),
    supabase.from("athletes").select("*").eq("id", athleteId).single(),
  ]);

  handleError(wellnessRes.error, "predictive-ai.predict-injury-risk.wellness");
  handleError(trainingRes.error, "predictive-ai.predict-injury-risk.training");
  handleError(athleteRes.error, "predictive-ai.predict-injury-risk.athlete");

  const wellness: WellnessEntry[] = handleData<WellnessEntry>(wellnessRes.data, null, "predictive-ai.predict-injury-risk.wellness");
  const training: TrainingEntry[] = handleData<TrainingEntry>(trainingRes.data, null, "predictive-ai.predict-injury-risk.training");
  const athlete = handleSingle<any>(athleteRes.data, null, "predictive-ai.predict-injury-risk.athlete");

  if (wellness.length === 0 && training.length === 0) return null;

  // ─── Factor Analysis ────────────────────────────────────

  const recentWellness = wellness.slice(0, 7);
  const recentTraining = training.slice(0, 7);
  const monthTraining = training.slice(0, 28);

  const avgWellness = recentWellness.length > 0
    ? recentWellness.reduce((s, w) => s + (w.wellness_score ?? 0), 0) / recentWellness.length
    : 50;

  const avgSoreness = recentWellness.length > 0
    ? recentWellness.reduce((s, w) => s + (w.muscle_soreness ?? 5), 0) / recentWellness.length
    : 5;

  const avgSleep = recentWellness.length > 0
    ? recentWellness.reduce((s, w) => s + (w.sleep_quality ?? 5), 0) / recentWellness.length
    : 5;

  const avgStress = recentWellness.length > 0
    ? recentWellness.reduce((s, w) => s + (w.stress_level ?? 5), 0) / recentWellness.length
    : 5;

  const acuteLoad = recentTraining.length > 0
    ? recentTraining.reduce((s, t) => s + t.load_score, 0) / recentTraining.length
    : 0;

  const chronicLoad = monthTraining.length > 0
    ? monthTraining.reduce((s, t) => s + t.load_score, 0) / monthTraining.length
    : 1;

  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
  const loadTrend = recentTraining.length > 3
    ? recentTraining[0].load_score - recentTraining[3].load_score
    : 0;

  // ─── Wellness Trend ─────────────────────────────────────

  const wellnessTrend = wellness.length > 6
    ? wellness.slice(0, 7).reduce((s, w, i) => s + (i > 0 ? wellness[i - 1].wellness_score - w.wellness_score : 0), 0) / 7
    : 0;

  // ─── Calculate Individual Factor Scores (0-100) ─────────

  const fatigueScore = Math.min(100, ((avgSoreness - 1) / 9) * 100);
  const sleepScore = Math.min(100, ((10 - avgSleep) / 9) * 100);
  const stressScore = Math.min(100, ((avgStress - 1) / 9) * 100);
  const wellnessDeclineScore = wellnessTrend < 0 ? Math.min(100, Math.abs(wellnessTrend) * 20) : 10;

  let acwrScore = 0;
  if (acwr < 0.8) acwrScore = Math.min(100, ((0.8 - acwr) / 0.8) * 60);
  else if (acwr > 1.3) acwrScore = Math.min(100, ((acwr - 1.3) / 0.7) * 80);
  else acwrScore = 10;

  const loadSpikeScore = Math.min(100, loadTrend > 100 ? 80 : loadTrend > 50 ? 50 : 10);

  // ─── Weighted Ensemble Score ────────────────────────────

  const weights = {
    wellnessDecline: 0.20,
    fatigueSoreness: 0.20,
    sleepQuality: 0.15,
    stressLevel: 0.10,
    acwrImbalance: 0.20,
    loadSpike: 0.15,
  };

  const rawScore =
    wellnessDeclineScore * weights.wellnessDecline +
    fatigueScore * weights.fatigueSoreness +
    sleepScore * weights.sleepQuality +
    stressScore * weights.stressLevel +
    acwrScore * weights.acwrImbalance +
    loadSpikeScore * weights.loadSpike;

  const riskScore = Math.round(Math.min(98, Math.max(2, rawScore)));

  // ─── Risk Level ─────────────────────────────────────────

  let riskLevel: AIPrediction["risk_level"] = "low";
  if (riskScore >= 75) riskLevel = "very_high";
  else if (riskScore >= 55) riskLevel = "high";
  else if (riskScore >= 30) riskLevel = "moderate";

  // ─── Confidence ─────────────────────────────────────────

  const dataPoints = wellness.length + training.length;
  let confidence: AIPrediction["confidence"] = "low";
  if (dataPoints > 40) confidence = "high";
  else if (dataPoints > 15) confidence = "medium";

  // ─── Trend Detection ────────────────────────────────────

  function getTrend(recent: number[], older: number[]): "improving" | "stable" | "declining" {
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    const diff = recentAvg - olderAvg;
    if (Math.abs(diff) < 0.3) return "stable";
    return diff > 0 ? "improving" : "declining";
  }

  // ─── Build Factor List ──────────────────────────────────

  const factors: AIPrediction["factors"] = [
    {
      label: "Wellness Decline",
      value: Math.round(wellnessDeclineScore),
      impact: weights.wellnessDecline,
      trend: getTrend(
        wellness.slice(0, 3).map((w) => w.wellness_score),
        wellness.slice(3, 7).map((w) => w.wellness_score)
      ),
      recommendation: wellnessDeclineScore > 40
        ? "Consider a recovery day. Wellness trending downward."
        : "Wellness stable. Continue current protocol.",
    },
    {
      label: "Fatigue & Soreness",
      value: Math.round(fatigueScore),
      impact: weights.fatigueSoreness,
      trend: getTrend(
        wellness.slice(0, 3).map((w) => w.muscle_soreness),
        wellness.slice(3, 7).map((w) => w.muscle_soreness)
      ),
      recommendation: fatigueScore > 50
        ? "Elevated soreness detected. Active recovery recommended."
        : "Soreness levels within normal range.",
    },
    {
      label: "Sleep Quality",
      value: Math.round(sleepScore),
      impact: weights.sleepQuality,
      trend: getTrend(
        wellness.slice(0, 3).map((w) => w.sleep_quality),
        wellness.slice(3, 7).map((w) => w.sleep_quality)
      ),
      recommendation: sleepScore > 50
        ? "Sleep quality declining. Review sleep hygiene protocol."
        : "Sleep quality adequate.",
    },
    {
      label: "Stress Level",
      value: Math.round(stressScore),
      impact: weights.stressLevel,
      trend: getTrend(
        wellness.slice(0, 3).map((w) => w.stress_level),
        wellness.slice(3, 7).map((w) => w.stress_level)
      ),
      recommendation: stressScore > 50
        ? "Elevated stress may impact recovery. Monitor closely."
        : "Stress levels manageable.",
    },
    {
      label: "ACWR Imbalance",
      value: Math.round(acwrScore),
      impact: weights.acwrImbalance,
      trend: acwr > 1.3 ? "declining" : acwr < 0.8 ? "declining" : "stable",
      recommendation: acwr > 1.5
        ? "ACWR very high. Reduce training load by 20-30%."
        : acwr > 1.3
        ? "ACWR elevated. Monitor load carefully."
        : acwr < 0.8
        ? "ACWR low. Consider increasing training stimulus."
        : "ACWR in optimal zone. Maintain current load.",
    },
    {
      label: "Load Spike",
      value: Math.round(loadSpikeScore),
      impact: weights.loadSpike,
      trend: loadTrend > 0 ? "declining" : "improving",
      recommendation: loadSpikeScore > 50
        ? "Significant load increase detected. Allow 48h recovery."
        : "Load changes within normal variation.",
    },
  ];

  // ─── Weekly Projection (4 weeks) ────────────────────────

  const weeklyProjection: AIPrediction["weeklyProjection"] = [];
  for (let w = 1; w <= 4; w++) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() + w * 7);
    const weekLabel = weekDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const decay = Math.max(0, 1 - w * 0.15);
    const projected = Math.round(Math.min(98, Math.max(3, riskScore * decay)));
    const spread = Math.round(5 + w * 3);

    weeklyProjection.push({
      week: weekLabel,
      predictedRisk: projected,
      lowerBound: Math.max(0, projected - spread),
      upperBound: Math.min(100, projected + spread),
    });
  }

  // ─── Insights ───────────────────────────────────────────

  const insights: string[] = [];

  if (riskScore >= 55) {
    insights.push("High injury risk detected — immediate intervention recommended.");
  } else if (riskScore >= 30) {
    insights.push("Moderate injury risk — proactive monitoring advised.");
  } else {
    insights.push("Low injury risk — continue current training protocol.");
  }

  if (acwr > 1.5) insights.push("ACWR exceeds safe threshold (1.5). Load management required.");
  if (avgWellness < 60) insights.push("Average wellness below 60 — consider recovery intervention.");
  if (avgSoreness > 7) insights.push("Muscle soreness consistently elevated above 7/10.");
  if (avgSleep < 5) insights.push("Chronic low sleep quality (<5/10) — significant risk factor.");
  if (loadTrend > 100) insights.push("Training load spiked more than 100 points in 3 days.");

  const recommendation = factors.sort((a, b) => b.impact - a.impact)[0]?.recommendation;
  if (recommendation) insights.push(`Priority action: ${recommendation}`);

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    probability: Math.round((riskScore / 100) * 100) / 100,
    confidence,
    factors,
    weeklyProjection,
    insights,
  };
}
