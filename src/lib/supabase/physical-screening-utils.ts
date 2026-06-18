"use client";

import type { PhysicalScreening, ScreeningScore } from "@/types";

const MOBILITY_KEYS: (keyof PhysicalScreening)[] = [
  "fms_deep_squat",
  "fms_hurdle_step",
  "fms_inline_lunge",
  "fms_shoulder_mobility",
  "fms_active_slr",
];
const STABILITY_KEYS: (keyof PhysicalScreening)[] = [
  "fms_trunk_stability",
  "fms_rotary_stability",
];

function nullableNum(v: unknown): number | null {
  if (typeof v === "number") return v;
  return null;
}

function calcMobility(s: PhysicalScreening): number | null {
  const scores = MOBILITY_KEYS.map((k) => nullableNum(s[k])).filter((v): v is number => v !== null);
  if (scores.length === 0) return null;
  const fmsPart = (scores.reduce((a, b) => a + b, 0) / (scores.length * 3)) * 100;

  const sitAndReach = nullableNum(s.sit_and_reach_cm);
  const sitPart = sitAndReach !== null ? Math.min(100, (sitAndReach / 40) * 100) : null;

  if (sitPart === null) return Math.round(fmsPart);
  return Math.round((fmsPart + sitPart) / 2);
}

function calcStability(s: PhysicalScreening): number | null {
  const scores = STABILITY_KEYS.map((k) => nullableNum(s[k])).filter((v): v is number => v !== null);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length * 3)) * 100);
}

function calcAsymmetry(s: PhysicalScreening): number | null {
  const diffs: number[] = [];

  const ybtL = nullableNum(s.ybt_composite_left);
  const ybtR = nullableNum(s.ybt_composite_right);
  if (ybtL !== null && ybtR !== null && ybtL + ybtR > 0) {
    diffs.push(Math.abs(ybtL - ybtR) / ((ybtL + ybtR) / 2));
  }

  const slhL = nullableNum(s.slh_left_cm);
  const slhR = nullableNum(s.slh_right_cm);
  if (slhL !== null && slhR !== null && Math.max(slhL, slhR) > 0) {
    const lsi = (Math.min(slhL, slhR) / Math.max(slhL, slhR)) * 100;
    diffs.push(Math.abs(100 - lsi) / 100);
  }

  const ybtAL = nullableNum(s.ybt_anterior_left);
  const ybtAR = nullableNum(s.ybt_anterior_right);
  if (ybtAL !== null && ybtAR !== null && ybtAL + ybtAR > 0) {
    diffs.push(Math.abs(ybtAL - ybtAR) / ((ybtAL + ybtAR) / 2));
  }

  if (diffs.length === 0) return null;
  const avgAsym = (diffs.reduce((a, b) => a + b, 0) / diffs.length) * 100;
  return Math.round(Math.max(0, 100 - avgAsym));
}

function calcFmsScore(s: PhysicalScreening): number | null {
  const total = nullableNum(s.fms_total);
  if (total === null) return null;
  return Math.round((total / 21) * 100);
}

export function computeScreeningScore(s: PhysicalScreening): ScreeningScore | null {
  const mobility = calcMobility(s);
  const stability = calcStability(s);
  const asymmetry = calcAsymmetry(s);
  const fms_score = calcFmsScore(s);

  if (mobility === null && stability === null && asymmetry === null && fms_score === null) {
    return null;
  }

  return {
    mobility: mobility ?? 0,
    stability: stability ?? 0,
    asymmetry: asymmetry ?? 0,
    fms_score: fms_score ?? 0,
    date: s.screening_date,
  };
}

export function computeScreeningScores(screenings: PhysicalScreening[]): ScreeningScore[] {
  return screenings
    .map(computeScreeningScore)
    .filter((s): s is ScreeningScore => s !== null);
}
