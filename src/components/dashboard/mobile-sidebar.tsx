"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types";

const typeIcons: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  success: "✅",
  error: "❌",
};

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setNotifications(data);
    }
    fetchNotifications();
  }, [supabase]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground shadow-lg">
        <div className="flex items-center justify-between border-b border-sidebar-accent px-4 h-16">
          <span className="font-bold text-lg">II Platform</span>
          <button onClick={onClose} className="text-sidebar-muted hover:text-sidebar-accent-foreground text-2xl">&times;</button>
        </div>
        <nav className="p-4 space-y-2">
          {notifications.length > 0 && (
            <div className="border-t border-sidebar-accent pt-4 mt-4">
              <p className="text-xs text-sidebar-muted mb-2 px-3">Recent Notifications</p>
              {notifications.map((n) => (
                <div key={n.id} className="flex items-start gap-2 px-3 py-2 text-sm">
                  <span>{typeIcons[n.type] || "ℹ️"}</span>
                  <span className="text-sidebar-muted text-xs">{n.title}</span>
                </div>
              ))}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
