"use client";

import { createClient } from "@/lib/supabase/client";
import type { Assessment } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getAssessments(athleteId: string): Promise<Assessment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("assessment_date", { ascending: false });
  return handleData<Assessment>(data, error, "assessments.get-all");
}

export async function createAssessment(
  athleteId: string,
  values: { assessment_date: string; type: string; score: number; notes?: string }
): Promise<Assessment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .insert({ ...values, athlete_id: athleteId })
    .select()
    .single();
  return handleSingle<Assessment>(data, error, "assessments.create");
}

export async function updateAssessment(
  id: string,
  values: { assessment_date?: string; type?: string; score?: number; notes?: string }
): Promise<Assessment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  return handleSingle<Assessment>(data, error, "assessments.update");
}

export async function deleteAssessment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  handleError(error, "assessments.delete");
}
