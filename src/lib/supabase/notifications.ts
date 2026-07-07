"use client";

import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export interface NotificationValues {
  user_id: string;
  title: string;
  message: string;
  type: Notification["type"];
  link?: string;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return handleData<Notification>(data, error, "notifications.get-all");
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("read", false)
    .order("created_at", { ascending: false });
  return handleData<Notification>(data, error, "notifications.get-unread");
}

export async function createNotification(values: NotificationValues): Promise<Notification | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: values.user_id,
      title: values.title,
      message: values.message,
      type: values.type,
      read: false,
      link: values.link ?? null,
    })
    .select()
    .single();
  return handleSingle<Notification>(data, error, "notifications.create");
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  handleError(error, "notifications.mark-read");
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  handleError(error, "notifications.mark-all-read");
}

export async function deleteNotification(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  handleError(error, "notifications.delete");
}
