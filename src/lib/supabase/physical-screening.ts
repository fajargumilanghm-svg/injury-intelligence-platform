"use client";

import { createClient } from "@/lib/supabase/client";
import type { PhysicalScreening } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getScreenings(athleteId: string): Promise<PhysicalScreening[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("physical_screenings")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("screening_date", { ascending: false });
  return handleData<PhysicalScreening>(data, error, "physical-screening.get-all");
}

export async function getLatestScreening(athleteId: string): Promise<PhysicalScreening | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("physical_screenings")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("screening_date", { ascending: false })
    .limit(1)
    .single();
  return handleSingle<PhysicalScreening>(data, error, "physical-screening.get-latest");
}

export interface ScreeningValues {
  screening_date: string;

  fms_deep_squat?: number;
  fms_hurdle_step?: number;
  fms_inline_lunge?: number;
  fms_shoulder_mobility?: number;
  fms_active_slr?: number;
  fms_trunk_stability?: number;
  fms_rotary_stability?: number;

  ybt_leg_length?: number;
  ybt_anterior_left?: number;
  ybt_anterior_right?: number;
  ybt_posteromedial_left?: number;
  ybt_posteromedial_right?: number;
  ybt_posterolateral_left?: number;
  ybt_posterolateral_right?: number;

  sit_and_reach_cm?: number;

  slh_left_cm?: number;
  slh_right_cm?: number;

  cmj_height_cm?: number;
  cmj_peak_power_w?: number;
  cmj_relative_power?: number;

  notes?: string;
}

function calcFmsTotal(v: Record<string, number | undefined>): number | null {
  const scores = [
    v.fms_deep_squat,
    v.fms_hurdle_step,
    v.fms_inline_lunge,
    v.fms_shoulder_mobility,
    v.fms_active_slr,
    v.fms_trunk_stability,
    v.fms_rotary_stability,
  ].filter((s): s is number => s !== undefined);
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0);
}

function calcSlhRatio(v: Record<string, number | undefined>): number | null {
  const left = v.slh_left_cm;
  const right = v.slh_right_cm;
  if (left === undefined || right === undefined || left === 0) return null;
  return Math.round((Math.min(left, right) / Math.max(left, right)) * 100);
}

function calcYbtComposite(directions: (number | undefined)[], legLength: number | undefined): number | null {
  const vals = directions.filter((d): d is number => d !== undefined);
  if (vals.length === 0 || vals.some((v) => v === 0)) return null;
  if (legLength === undefined || legLength === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  // Correct YBT composite: sum_of_reaches / (leg_length * 3) * 100
  return Math.round((sum / (legLength * 3)) * 100);
}

export async function createScreening(
  athleteId: string,
  values: ScreeningValues
): Promise<PhysicalScreening | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("physical_screenings")
    .insert({
      athlete_id: athleteId,
      screening_date: values.screening_date,
      notes: values.notes ?? null,

      fms_deep_squat: values.fms_deep_squat ?? null,
      fms_hurdle_step: values.fms_hurdle_step ?? null,
      fms_inline_lunge: values.fms_inline_lunge ?? null,
      fms_shoulder_mobility: values.fms_shoulder_mobility ?? null,
      fms_active_slr: values.fms_active_slr ?? null,
      fms_trunk_stability: values.fms_trunk_stability ?? null,
      fms_rotary_stability: values.fms_rotary_stability ?? null,
      fms_total: calcFmsTotal(values as unknown as Record<string, number | undefined>),

      ybt_leg_length: values.ybt_leg_length ?? null,
      ybt_anterior_left: values.ybt_anterior_left ?? null,
      ybt_anterior_right: values.ybt_anterior_right ?? null,
      ybt_posteromedial_left: values.ybt_posteromedial_left ?? null,
      ybt_posteromedial_right: values.ybt_posteromedial_right ?? null,
      ybt_posterolateral_left: values.ybt_posterolateral_left ?? null,
      ybt_posterolateral_right: values.ybt_posterolateral_right ?? null,
      ybt_composite_left: values.ybt_anterior_left !== undefined && values.ybt_posteromedial_left !== undefined && values.ybt_posterolateral_left !== undefined
        ? calcYbtComposite([values.ybt_anterior_left, values.ybt_posteromedial_left, values.ybt_posterolateral_left], values.ybt_leg_length)
        : null,
      ybt_composite_right: values.ybt_anterior_right !== undefined && values.ybt_posteromedial_right !== undefined && values.ybt_posterolateral_right !== undefined
        ? calcYbtComposite([values.ybt_anterior_right, values.ybt_posteromedial_right, values.ybt_posterolateral_right], values.ybt_leg_length)
        : null,

      sit_and_reach_cm: values.sit_and_reach_cm ?? null,

      slh_left_cm: values.slh_left_cm ?? null,
      slh_right_cm: values.slh_right_cm ?? null,
      slh_ratio: calcSlhRatio(values as unknown as Record<string, number | undefined>),

      cmj_height_cm: values.cmj_height_cm ?? null,
      cmj_peak_power_w: values.cmj_peak_power_w ?? null,
      cmj_relative_power: values.cmj_relative_power ?? null,
    })
    .select()
    .single();
  return handleSingle<PhysicalScreening>(data, error, "physical-screening.create");
}

export async function updateScreening(
  id: string,
  values: Partial<ScreeningValues>
): Promise<PhysicalScreening | null> {
  const supabase = createClient();
  const updateData: Record<string, unknown> = { ...values };

  // Recalculate derived fields if contributing inputs are provided
  const hasFms = [
    "fms_deep_squat", "fms_hurdle_step", "fms_inline_lunge",
    "fms_shoulder_mobility", "fms_active_slr",
    "fms_trunk_stability", "fms_rotary_stability",
  ].some((k) => k in values);
  if (hasFms) {
    const fmsTotal = calcFmsTotal(values as unknown as Record<string, number | undefined>);
    if (fmsTotal !== null) updateData.fms_total = fmsTotal;
  }

  const hasYbtLeft = values.ybt_anterior_left !== undefined || values.ybt_posteromedial_left !== undefined || values.ybt_posterolateral_left !== undefined;
  const hasYbtRight = values.ybt_anterior_right !== undefined || values.ybt_posteromedial_right !== undefined || values.ybt_posterolateral_right !== undefined;
  if (hasYbtLeft || hasYbtRight) {
    // Fetch existing record to merge partial updates
    const { data: existing } = await supabase.from("physical_screenings").select("*").eq("id", id).single();
    if (existing) {
      const merged = { ...existing, ...values };
      if (hasYbtLeft && merged.ybt_anterior_left !== undefined && merged.ybt_posteromedial_left !== undefined && merged.ybt_posterolateral_left !== undefined) {
        updateData.ybt_composite_left = calcYbtComposite(
          [merged.ybt_anterior_left, merged.ybt_posteromedial_left, merged.ybt_posterolateral_left],
          merged.ybt_leg_length
        );
      }
      if (hasYbtRight && merged.ybt_anterior_right !== undefined && merged.ybt_posteromedial_right !== undefined && merged.ybt_posterolateral_right !== undefined) {
        updateData.ybt_composite_right = calcYbtComposite(
          [merged.ybt_anterior_right, merged.ybt_posteromedial_right, merged.ybt_posterolateral_right],
          merged.ybt_leg_length
        );
      }
    }
  }

  const hasSlh = values.slh_left_cm !== undefined || values.slh_right_cm !== undefined;
  if (hasSlh) {
    const slhRatio = calcSlhRatio(values as unknown as Record<string, number | undefined>);
    if (slhRatio !== null) updateData.slh_ratio = slhRatio;
  }

  const { data, error } = await supabase
    .from("physical_screenings")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  return handleSingle<PhysicalScreening>(data, error, "physical-screening.update");
}

export async function deleteScreening(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("physical_screenings").delete().eq("id", id);
  handleError(error, "physical-screening.delete");
}
