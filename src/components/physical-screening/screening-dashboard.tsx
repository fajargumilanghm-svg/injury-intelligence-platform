"use client";

import { useMemo } from "react";
import type { PhysicalScreening, ScreeningScore } from "@/types";
import { computeScreeningScores } from "@/lib/supabase/physical-screening-utils";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Activity, Fence, ArrowLeftRight, ClipboardList } from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

interface ScreeningDashboardProps {
  screenings: PhysicalScreening[];
}

const scoreMeta = [
  { key: "mobility", label: "Mobility", icon: Activity, color: "#2563eb" },
  { key: "stability", label: "Stability", icon: Fence, color: "#7c3aed" },
  { key: "asymmetry", label: "Asymmetry", icon: ArrowLeftRight, color: "#d97706" },
  { key: "fms_score", label: "FMS Score", icon: ClipboardList, color: "#16a34a" },
];

export function ScreeningDashboard({ screenings }: ScreeningDashboardProps) {
  const scores = useMemo(() => computeScreeningScores(screenings), [screenings]);
  const latest = scores[0];

  const radarData = scoreMeta.map((m) => ({
    category: m.label,
    value: latest?.[m.key as keyof ScreeningScore] ?? 0,
    fullMark: 100,
  }));

  const trendData = useMemo(() => {
    const reversed = [...scores].reverse().map((s) => ({
      date: s.date,
      mobility: s.mobility,
      stability: s.stability,
      asymmetry: s.asymmetry,
      fms_score: s.fms_score,
    }));
    return reversed.map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [scores]);

  if (screenings.length === 0) {
    return (
      <div className="text-center py-16">
        <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Screening Data</h3>
        <p className="text-sm text-muted-foreground">Complete a screening session to see your dashboard.</p>
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Insufficient data to compute scores. Complete at least one screening with FMS, Y Balance, or Single Leg Hop results.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scoreMeta.map((m) => {
          const val = Number(latest[m.key as keyof ScreeningScore]);
          const color = val >= 80 ? "#22c55e" : val >= 50 ? "#f59e0b" : "#ef4444";
          const Icon = m.icon;
          return (
            <div key={m.key} className="rounded-xl border bg-card p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${m.color}20` }}>
                <Icon className="h-6 w-6" style={{ color: m.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color }}>{val}</p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted max-w-[80px]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${val}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Score Profile
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} className="text-muted-foreground" />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value) => [value, "Score"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Trend Graph
          </h3>
          {trendData.length > 1 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value) => [value, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {scoreMeta.map((m) => (
                    <Line
                      key={m.key}
                      type="monotone"
                      dataKey={m.key}
                      stroke={m.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={m.label}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-20">
              Complete multiple screening sessions to view the trend.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
