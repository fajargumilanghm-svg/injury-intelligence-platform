"use client";

import { createClient } from "@/lib/supabase/client";
import type { InjuryRecord, InjurySeverity, InjuryStatus, InjuryMechanism, InjurySide, RecoveryMilestone, MilestoneType, RtpPhase, RtpPhaseStatus } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

// ─── Injuries ───────────────────────────────────────────────

export async function getInjuries(athleteId: string): Promise<InjuryRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("injuries")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("injury_date", { ascending: false });
  return handleData<InjuryRecord>(data, error, "injuries.getAll");
}

export async function getInjury(id: string): Promise<InjuryRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("injuries").select("*").eq("id", id).single();
  return handleSingle<InjuryRecord>(data, error, "injuries.get");
}

export interface InjuryValues {
  injury_date: string;
  injury_type: string;
  body_part: string;
  severity: InjurySeverity;
  mechanism: InjuryMechanism | null;
  side: InjurySide;
  diagnosis: string | null;
  status: InjuryStatus;
  estimated_recovery_days: number | null;
  actual_recovery_days: number | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  return_to_play_date: string | null;
  treatment_notes: string | null;
}

export async function createInjury(
  athleteId: string,
  values: InjuryValues
): Promise<InjuryRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("injuries")
    .insert({
      athlete_id: athleteId,
      injury_date: values.injury_date,
      injury_type: values.injury_type,
      body_part: values.body_part,
      severity: values.severity,
      mechanism: values.mechanism,
      side: values.side,
      diagnosis: values.diagnosis,
      status: values.status,
      estimated_recovery_days: values.estimated_recovery_days,
      actual_recovery_days: values.actual_recovery_days,
      expected_return_date: values.expected_return_date,
      actual_return_date: values.actual_return_date,
      return_to_play_date: values.return_to_play_date,
      treatment_notes: values.treatment_notes,
    })
    .select()
    .single();
  return handleSingle<InjuryRecord>(data, error, "injuries.create");
}

export async function updateInjury(
  id: string,
  values: Partial<InjuryValues>
): Promise<InjuryRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("injuries")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  return handleSingle<InjuryRecord>(data, error, "injuries.update");
}

export async function deleteInjury(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("injuries").delete().eq("id", id);
  handleError(error, "injuries.delete");
}

// ─── Recovery Milestones ────────────────────────────────────

export async function getMilestones(injuryId: string): Promise<RecoveryMilestone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recovery_milestones")
    .select("*")
    .eq("injury_id", injuryId)
    .order("milestone_date", { ascending: true });
  return handleData<RecoveryMilestone>(data, error, "injuries.getMilestones");
}

export interface MilestoneValues {
  milestone_date: string;
  milestone_type: MilestoneType;
  description: string;
  completed: boolean;
}

export async function createMilestone(
  injuryId: string,
  values: MilestoneValues
): Promise<RecoveryMilestone | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recovery_milestones")
    .insert({
      injury_id: injuryId,
      milestone_date: values.milestone_date,
      milestone_type: values.milestone_type,
      description: values.description,
      completed: values.completed,
    })
    .select()
    .single();
  return handleSingle<RecoveryMilestone>(data, error, "injuries.createMilestone");
}

export async function updateMilestone(
  id: string,
  values: Partial<MilestoneValues>
): Promise<RecoveryMilestone | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recovery_milestones")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  return handleSingle<RecoveryMilestone>(data, error, "injuries.updateMilestone");
}

export async function deleteMilestone(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recovery_milestones").delete().eq("id", id);
  handleError(error, "injuries.deleteMilestone");
}

// ─── Return to Play Phases ──────────────────────────────────

export async function getRtpPhases(injuryId: string): Promise<RtpPhase[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rtp_phases")
    .select("*")
    .eq("injury_id", injuryId)
    .order("phase_number", { ascending: true });
  return handleData<RtpPhase>(data, error, "injuries.getRtpPhases");
}

export interface RtpPhaseValues {
  phase_number: number;
  phase_name: string;
  description: string;
  start_date: string | null;
  completion_date: string | null;
  status: RtpPhaseStatus;
}

export async function upsertRtpPhase(
  injuryId: string,
  values: RtpPhaseValues
): Promise<RtpPhase | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rtp_phases")
    .upsert({
      injury_id: injuryId,
      phase_number: values.phase_number,
      phase_name: values.phase_name,
      description: values.description,
      start_date: values.start_date,
      completion_date: values.completion_date,
      status: values.status,
    }, { onConflict: "injury_id,phase_number" })
    .select()
    .single();
  return handleSingle<RtpPhase>(data, error, "injuries.upsertRtpPhase");
}

export async function initializeRtpPhases(injuryId: string): Promise<void> {
  const { RTP_PHASES } = await import("@/types");
  const supabase = createClient();
  const phases = RTP_PHASES.map((p) => ({
    injury_id: injuryId,
    phase_number: p.phase_number,
    phase_name: p.phase_name,
    description: p.description,
    start_date: null,
    completion_date: null,
    status: "pending" as RtpPhaseStatus,
  }));
  const { error } = await supabase.from("rtp_phases").upsert(phases, { onConflict: "injury_id,phase_number" });
  handleError(error, "injuries.initializeRtpPhases");
}
