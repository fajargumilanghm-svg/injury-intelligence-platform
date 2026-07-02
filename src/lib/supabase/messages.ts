"use client";

import { createClient } from "@/lib/supabase/client";
import type { Message, UserProfile } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getAllMessagingUsers(): Promise<(UserProfile & { user_id: string })[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return (handleData(data, error, "messages.get-all-users") as (UserProfile & { user_id: string })[]) ?? [];
}

export async function getMessages(userId: string, partnerId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
    .order("created_at", { ascending: true });
  return handleData<Message>(data, error, "messages.get-messages");
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<Message | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select()
    .single();
  return handleSingle<Message>(data, error, "messages.send");
}

export async function markMessagesRead(receiverId: string, senderId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("receiver_id", receiverId)
    .eq("sender_id", senderId)
    .eq("read", false);
  handleError(error, "messages.mark-read");
}
