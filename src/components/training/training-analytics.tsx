"use client";

import { useState, useEffect, useMemo } from "react";
import { getTrainingEntries, getTrainingTrend, getAcwrTrend, getAcwrInsights } from "@/lib/supabase/training";
import { LoadHeatmap } from "@/components/training/load-heatmap";
import type { TrainingEntry, AcwrDataPoint } from "@/types";
import { Loader2, TrendingUp, BarChart3, CalendarDays, Brain, AlertTriangle, Info } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
  Area, AreaChart, ReferenceLine, Legend,
} from "recharts";

interface TrainingAnalyticsProps {
  athleteId: string;
}

export function TrainingAnalytics({ athleteId }: TrainingAnalyticsProps) {
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [trend, setTrend] = useState<{ date: string; load_score: number; duration: number; intensity: number }[]>([]);
  const [acwrTrend, setAcwrTrend] = useState<AcwrDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  async function loadData() {
    const [entriesData, trendData, acwrData] = await Promise.all([
      getTrainingEntries(athleteId),
      getTrainingTrend(athleteId, 90),
      getAcwrTrend(athleteId, 60),
    ]);
    setEntries(entriesData);
    setTrend(trendData);
    setAcwrTrend(acwrData);
    setIsLoading(false);
  }

  const weeklyData = useMemo(() => {
    const weekMap = new Map<string, { week: string; total_load: number; sessions: number; avg_intensity: number }>();
    for (const e of entries) {
      const d = new Date(e.training_date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split("T")[0];
      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = weekMap.get(key) ?? { week: label, total_load: 0, sessions: 0, avg_intensity: 0 };
      existing.total_load += e.load_score;
      existing.sessions += 1;
      existing.avg_intensity = Math.round((existing.avg_intensity * (existing.sessions - 1) + e.intensity_rpe) / existing.sessions * 10) / 10;
      weekMap.set(key, existing);
    }
    return [...weekMap.values()].slice(-12);
  }, [entries]);

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; total_load: number; sessions: number }>();
    for (const e of entries) {
      const d = new Date(e.training_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const existing = monthMap.get(key) ?? { month: label, total_load: 0, sessions: 0 };
      existing.total_load += e.load_score;
      existing.sessions += 1;
      monthMap.set(key, existing);
    }
    return [...monthMap.values()];
  }, [entries]);

  const insights = useMemo(() => getAcwrInsights(acwrTrend), [acwrTrend]);

  const acwrRiskColor = (zone: string) => {
    switch (zone) {
      case "low": return "#f59e0b";
      case "optimal": return "#22c55e";
      case "high": return "#f97316";
      case "very_high": return "#ef4444";
      default: return "#94a3b8";
    }
  };

  const heatmapData = useMemo(() => {
    return trend.map((t) => ({
      date: t.date,
      load_score: t.load_score,
    }));
  }, [trend]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No training data to analyze yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Daily Load Trend
          </h3>
          {trend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={6} />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="load_score" stroke="#3b82f6" fill="url(#dailyGrad)" strokeWidth={2} name="Daily Load" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground py-12 text-center">No data</p>}
        </div>

        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Weekly Load Trend
          </h3>
          {weeklyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="total_load" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Weekly Load" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground py-12 text-center">No weekly data</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Monthly Load Trend
          </h3>
          {monthlyData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="total_load" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Monthly Load" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground py-12 text-center">No monthly data</p>}
        </div>

        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> ACWR Trend
          </h3>
          {acwrTrend.length > 7 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={acwrTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval={6} />
                  <YAxis domain={[0, 2.5]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value) => typeof value === "number" ? value.toFixed(2) : value} />
                  <ReferenceLine y={0.8} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Under", fontSize: 10, fill: "#f59e0b" }} />
                  <ReferenceLine y={1.3} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Optimal", fontSize: 10, fill: "#22c55e" }} />
                  <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Risk", fontSize: 10, fill: "#ef4444" }} />
                  <Line type="monotone" dataKey="acwr" stroke="#8b5cf6" strokeWidth={2} dot={false} name="ACWR" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">Need more data for ACWR trend</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-5">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" /> Load Heatmap (Last 12 Weeks)
        </h3>
        <LoadHeatmap data={heatmapData} />
      </div>

      {acwrTrend.length > 7 && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#f59e0b" }} /> Under
              </div>
              <p className="text-sm font-bold">&lt; 0.8</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#22c55e" }} /> Optimal
              </div>
              <p className="text-sm font-bold">0.8 – 1.3</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#f97316" }} /> High
              </div>
              <p className="text-sm font-bold">1.3 – 1.5</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} /> Very High
              </div>
              <p className="text-sm font-bold">&gt; 1.5</p>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> ACWR Insights
            </h3>
            <div className="space-y-2">
              {insights.map((insight, i) => {
                const isWarning = insight.toLowerCase().includes("warning") || insight.toLowerCase().includes("risk") || insight.toLowerCase().includes("high");
                return (
                  <div key={i} className={`flex items-start gap-2 rounded-lg p-3 ${isWarning ? "bg-red-50" : "bg-muted/50"}`}>
                    {isWarning ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" /> : <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />}
                    <p className={`text-sm ${isWarning ? "text-red-800" : ""}`}>{insight}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
