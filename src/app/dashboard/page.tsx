"use client";

import { useAuth } from "@/context/auth-context";
import {
  Users,
  Activity,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const statCards = [
  {
    label: "Total Athletes",
    value: "128",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Active Injuries",
    value: "23",
    change: "-8%",
    trend: "down",
    icon: AlertTriangle,
    color: "text-red-600 bg-red-50",
  },
  {
    label: "Assessments",
    value: "47",
    change: "+23%",
    trend: "up",
    icon: Activity,
    color: "text-green-600 bg-green-50",
  },
  {
    label: "Appointments",
    value: "156",
    change: "+5%",
    trend: "up",
    icon: Calendar,
    color: "text-purple-600 bg-purple-50",
  },
];

const recentActivities = [
  {
    user: "Sarah Johnson",
    action: "completed injury assessment",
    time: "10 minutes ago",
    type: "assessment",
  },
  {
    user: "Mike Chen",
    action: "reported hamstring pain",
    time: "1 hour ago",
    type: "injury",
  },
  {
    user: "Dr. Williams",
    action: "updated treatment plan",
    time: "2 hours ago",
    type: "treatment",
  },
  {
    user: "Emma Davis",
    action: "attended physiotherapy session",
    time: "3 hours ago",
    type: "appointment",
  },
  {
    user: "Alex Rodriguez",
    action: "cleared for full training",
    time: "5 hours ago",
    type: "clearance",
  },
];

export default function DashboardPage() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your injury intelligence overview
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={card.color + " rounded-lg p-2"}>
                  <Icon className="h-5 w-5" />
                </div>
                {card.trend === "up" ? (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                    <ArrowUp className="h-3 w-3" />
                    {card.change}
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-red-600">
                    <ArrowDown className="h-3 w-3" />
                    {card.change}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {activity.user
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    {activity.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Injury Risk Overview</h2>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Hamstring Strain</span>
                <span className="font-medium">High Risk</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 w-4/5 rounded-full bg-red-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>ACL Recovery</span>
                <span className="font-medium">Moderate Risk</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 w-3/5 rounded-full bg-amber-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Ankle Sprain</span>
                <span className="font-medium">Low Risk</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 w-1/5 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Shoulder Impingement</span>
                <span className="font-medium">Low Risk</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 w-1/4 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
