"use client";

import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import { handleData, handleError } from "./helpers";

export async function getAllUsers(): Promise<UserProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return handleData<UserProfile>(data, error, "admin.get-all-users");
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("user_id", userId);
  handleError(error, "admin.update-role");
}
