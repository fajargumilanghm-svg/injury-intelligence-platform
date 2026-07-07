"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import type { Notification, NavItem } from "@/types";
import {
  LayoutDashboard,
  Users,
  Activity,
  FileText,
  Calendar,
  MessageSquare,
  BarChart3,
  Download,
  Shield,
  Settings,
  Heart,
  Dumbbell,
  BrainCircuit,
  Gauge,
  ClipboardList,
  Stethoscope,
  Target,
  TrendingUp,
} from "lucide-react";

const typeIcons: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  success: "✅",
  error: "❌",
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Athletes", href: "/dashboard/athletes", icon: Users, roles: ["coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "ACWR", href: "/dashboard/acwr/dashboard", icon: Gauge, roles: ["coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Risk Score", href: "/dashboard/injury-risk/dashboard", icon: Shield, roles: ["coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Screening", href: "/dashboard/physical-screening", icon: ClipboardList, roles: ["physiotherapist", "sport_scientist", "administrator"] },
  { label: "Injury Records", href: "/dashboard/injuries", icon: Stethoscope, roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Team Intelligence", href: "/dashboard/team-intelligence", icon: BarChart3, roles: ["coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Training", href: "/dashboard/training", icon: Dumbbell, roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Wellness", href: "/dashboard/wellness/dashboard", icon: Heart, roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Assessments", href: "/dashboard/assessments", icon: FileText, roles: ["physiotherapist", "sport_scientist"] },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar, roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare, roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Predictive AI", href: "/dashboard/predictive-ai", icon: BrainCircuit, roles: ["coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "ML Analytics", href: "/dashboard/predictive-analytics", icon: TrendingUp, roles: ["coach", "physiotherapist", "sport_scientist", "administrator"] },
  { label: "Admin", href: "/dashboard/admin", icon: Shield, roles: ["administrator"] },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"] },
];

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const supabase = createClient();
  const pathname = usePathname();
  const { role } = useAuth();

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

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  });

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-sidebar text-sidebar-foreground shadow-lg flex flex-col">
        <div className="flex items-center justify-between border-b border-sidebar-accent px-4 h-16">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg" onClick={onClose}>
            <Activity className="h-6 w-6 text-primary" />
            <span>II Platform</span>
          </Link>
          <button onClick={onClose} className="text-sidebar-muted hover:text-sidebar-accent-foreground text-2xl" aria-label="Close menu">&times;</button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
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
