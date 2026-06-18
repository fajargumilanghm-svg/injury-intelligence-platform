"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import type { NavItem, UserRole } from "@/types";
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
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  BrainCircuit,
  Gauge,
  ClipboardList,
  Stethoscope,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Athletes",
    href: "/dashboard/athletes",
    icon: Users,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "ACWR",
    href: "/dashboard/acwr/dashboard",
    icon: Gauge,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Risk Score",
    href: "/dashboard/injury-risk/dashboard",
    icon: Shield,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Screening",
    href: "/dashboard/physical-screening",
    icon: ClipboardList,
    roles: ["physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Screening Dashboard",
    href: "/dashboard/physical-screening/dashboard",
    icon: Gauge,
    roles: ["physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Injury Records",
    href: "/dashboard/injuries",
    icon: Stethoscope,
    roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "RTP Dashboard",
    href: "/dashboard/injuries/rtp-dashboard",
    icon: Target,
    roles: ["physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Team Intelligence",
    href: "/dashboard/team-intelligence",
    icon: BarChart3,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Training",
    href: "/dashboard/training",
    icon: Dumbbell,
    roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Analytics",
    href: "/dashboard/training/analytics",
    icon: BrainCircuit,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Wellness",
    href: "/dashboard/wellness/dashboard",
    icon: Heart,
    roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Assessments",
    href: "/dashboard/assessments",
    icon: FileText,
    roles: ["physiotherapist", "sport_scientist"],
  },
  {
    label: "Appointments",
    href: "/dashboard/appointments",
    icon: Calendar,
    roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Messages",
    href: "/dashboard/messages",
    icon: MessageSquare,
    roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Download Reports",
    href: "/dashboard/reports/downloads",
    icon: Download,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Predictive AI",
    href: "/dashboard/predictive-ai",
    icon: BrainCircuit,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "ML Analytics",
    href: "/dashboard/predictive-analytics",
    icon: TrendingUp,
    roles: ["coach", "physiotherapist", "sport_scientist", "administrator"],
  },
  {
    label: "Admin",
    href: "/dashboard/admin",
    icon: Shield,
    roles: ["administrator"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["athlete", "coach", "physiotherapist", "sport_scientist", "administrator"],
  },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  });

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-accent px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Activity className="h-6 w-6 text-primary" />
            <span>II Platform</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <Activity className="h-6 w-6 text-primary" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 hover:bg-sidebar-accent hidden lg:block"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
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
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-accent p-3">
        {!collapsed && (
          <p className="text-xs text-sidebar-muted px-3">
            {role && (
              <span className="capitalize">
                {role.replace(/_/g, " ")}
              </span>
            )}
          </p>
        )}
      </div>
    </aside>
  );
}
