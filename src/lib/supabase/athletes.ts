"use client";

import { createClient } from "@/lib/supabase/client";
import type { Athlete } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getAthletes(): Promise<Athlete[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("*")
    .order("created_at", { ascending: false });
  return handleData<Athlete>(data, error, "athletes.get-all");
}

export async function getAthlete(id: string): Promise<Athlete | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("athletes")
    .select("*")
    .eq("id", id)
    .single();
  return handleSingle<Athlete>(data, error, "athletes.get");
}

export async function createAthlete(
  values: Omit<Athlete, "id" | "avatar_url" | "user_id" | "created_at" | "updated_at">
): Promise<Athlete | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("athletes")
    .insert({ ...values, user_id: user?.id ?? null })
    .select()
    .single();
  return handleSingle<Athlete>(data, error, "athletes.create");
}

export async function updateAthlete(
  id: string,
  values: Partial<Omit<Athlete, "id" | "created_at" | "updated_at">>
): Promise<Athlete | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("athletes")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  return handleSingle<Athlete>(data, error, "athletes.update");
}

export async function deleteAthlete(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("athletes").delete().eq("id", id);
  handleError(error, "athletes.delete");
}
