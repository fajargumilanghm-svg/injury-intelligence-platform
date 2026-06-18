"use client";

import { useEffect, useState } from "react";
import { getWellnessEntries, getWellnessTrend } from "@/lib/supabase/wellness";
import type { WellnessEntry, WellnessTrend } from "@/types";
import { Loader2, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { format } from "date-fns";

interface WellnessHistoryProps {
  athleteId: string;
  compact?: boolean;
}

export function WellnessHistory({ athleteId, compact }: WellnessHistoryProps) {
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [trend, setTrend] = useState<WellnessTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  async function loadData() {
    const [entriesData, trendData] = await Promise.all([
      getWellnessEntries(athleteId),
      getWellnessTrend(athleteId, compact ? 7 : 30),
    ]);
    setEntries(entriesData);
    setTrend(trendData);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No wellness data yet.</p>
      </div>
    );
  }

  const avgScore = Math.round(
    entries.reduce((sum, e) => sum + e.wellness_score, 0) / entries.length
  );

  const latest = entries[0];

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{avgScore}</p>
            <p className="text-xs text-muted-foreground">Avg. Wellness Score</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Total Entries</p>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold">{latest?.wellness_score ?? "-"}</p>
            <p className="text-xs text-muted-foreground">Latest Score</p>
          </div>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium mb-3">Wellness Score Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221.2 83.2% 53.3%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                interval={compact ? 0 : "preserveStartEnd"}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid hsl(214.3 31.8% 91.4%)" }}
              />
              <Area
                type="monotone"
                dataKey="wellness_score"
                stroke="hsl(221.2 83.2% 53.3%)"
                fill="url(#wellnessGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {compact && (
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-3">Metrics Detail (Last 7 Days)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="sleep_quality" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Sleep" />
                <Line type="monotone" dataKey="mood_state" stroke="#10b981" strokeWidth={1.5} dot={false} name="Mood" />
                <Line type="monotone" dataKey="recovery_feeling" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Recovery" />
                <Line type="monotone" dataKey="stress_level" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Stress" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!compact && (
        <>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium mb-3">Metrics Breakdown (30 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={4} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="sleep_quality" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Sleep Quality" />
                  <Line type="monotone" dataKey="fatigue" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Fatigue (inverted)" />
                  <Line type="monotone" dataKey="muscle_soreness" stroke="#f97316" strokeWidth={1.5} dot={false} name="Muscle Soreness (inverted)" />
                  <Line type="monotone" dataKey="stress_level" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Stress Level (inverted)" />
                  <Line type="monotone" dataKey="mood_state" stroke="#10b981" strokeWidth={1.5} dot={false} name="Mood State" />
                  <Line type="monotone" dataKey="recovery_feeling" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Recovery Feeling" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Sleep</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Fatigue</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Soreness</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Stress</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Mood</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Recovery</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2.5 text-sm">
                        {format(new Date(entry.submitted_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {entry.wellness_score}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm">{entry.sleep_quality}</td>
                      <td className="px-4 py-2.5 text-sm">{entry.fatigue}</td>
                      <td className="px-4 py-2.5 text-sm">{entry.muscle_soreness}</td>
                      <td className="px-4 py-2.5 text-sm">{entry.stress_level}</td>
                      <td className="px-4 py-2.5 text-sm">{entry.mood_state}</td>
                      <td className="px-4 py-2.5 text-sm">{entry.recovery_feeling}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
