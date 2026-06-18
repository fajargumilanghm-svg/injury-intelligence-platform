"use client";

import Link from "next/link";
import { BarChart3, User, Users, AlertTriangle, Heart, Dumbbell, ArrowRight } from "lucide-react";

const reports = [
  { label: "Athlete Report", desc: "Comprehensive per-athlete summary with wellness, training, and injury data", href: "/dashboard/reports/athlete", icon: User, color: "text-blue-600", bg: "bg-blue-100" },
  { label: "Team Report", desc: "Aggregate team metrics, injury distribution, and recovery rates", href: "/dashboard/reports/team", icon: Users, color: "text-green-600", bg: "bg-green-100" },
  { label: "Injury Analysis", desc: "Injury trends by type, location, severity, and mechanism", href: "/dashboard/reports/injury", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
  { label: "Wellness Report", desc: "Wellness trends, component averages, and low-day analysis", href: "/dashboard/reports/wellness", icon: Heart, color: "text-pink-600", bg: "bg-pink-100" },
  { label: "Training Load Report", desc: "Training volume, intensity, load distribution, and ACWR", href: "/dashboard/reports/training", icon: Dumbbell, color: "text-purple-600", bg: "bg-purple-100" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Professional reporting suite &mdash; date range filtering, CSV export, and print-friendly layouts
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-xl border bg-card p-5 hover:shadow-md transition-all hover:border-primary/30"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${r.bg} mb-4`}>
                <Icon className={`h-6 w-6 ${r.color}`} />
              </div>
              <h3 className="font-semibold group-hover:text-primary transition-colors">{r.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
              <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-6 text-center">
        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />
        <h3 className="font-semibold mt-2">Professional-Grade Reports</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
          All reports support date range filtering, CSV export for external analysis, 
          and print-friendly layouts for clinical documentation.
        </p>
      </div>
    </div>
  );
}
