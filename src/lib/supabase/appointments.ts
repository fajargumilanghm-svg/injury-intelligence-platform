"use client";

import { createClient } from "@/lib/supabase/client";
import type { Appointment } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getAppointments(athleteId: string): Promise<Appointment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("appointment_date", { ascending: true });
  return handleData<Appointment>(data, error, "appointments.get-all");
}

export async function createAppointment(
  values: Omit<Appointment, "id" | "created_at" | "updated_at">
): Promise<Appointment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert(values)
    .select()
    .single();
  return handleSingle<Appointment>(data, error, "appointments.create");
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  handleError(error, "appointments.update-status");
}

export async function cancelAppointment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  handleError(error, "appointments.cancel");
}
