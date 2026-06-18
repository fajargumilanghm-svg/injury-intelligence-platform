"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getWellnessTrend, getTodayEntry } from "@/lib/supabase/wellness";
import type { WellnessTrend, WellnessEntry } from "@/types";
import { Loader2, TrendingUp, Activity, CalendarDays } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  BarChart, Bar, Legend,
} from "recharts";

function getTrafficLight(score: number): { color: string; bg: string; label: string; textColor: string } {
  if (score >= 75) return { color: "#22c55e", bg: "bg-green-50", label: "Good", textColor: "text-green-700" };
  if (score >= 50) return { color: "#eab308", bg: "bg-amber-50", label: "Monitor", textColor: "text-amber-700" };
  return { color: "#ef4444", bg: "bg-red-50", label: "High Risk", textColor: "text-red-700" };
}

interface WellnessDashboardProps {
  athleteId: string;
}

export function WellnessDashboard({ athleteId }: WellnessDashboardProps) {
  const [trend, setTrend] = useState<WellnessTrend[]>([]);
  const [todayEntry, setTodayEntry] = useState<WellnessEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  async function loadData() {
    const [trendData, today] = await Promise.all([
      getWellnessTrend(athleteId, 30),
      getTodayEntry(athleteId),
    ]);
    setTrend(trendData);
    setTodayEntry(today);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const weeklyData = trend.slice(-7);
  const monthlyData = trend;
  const dailyScore = todayEntry?.wellness_score ?? null;
  const dailyTraffic = dailyScore !== null ? getTrafficLight(dailyScore) : null;
  const avgWeekly = weeklyData.length > 0
    ? Math.round(weeklyData.reduce((s, d) => s + d.wellness_score, 0) / weeklyData.length)
    : null;
  const avgMonthly = monthlyData.length > 0
    ? Math.round(monthlyData.reduce((s, d) => s + d.wellness_score, 0) / monthlyData.length)
    : null;
  const weeklyTraffic = avgWeekly !== null ? getTrafficLight(avgWeekly) : null;
  const monthlyTraffic = avgMonthly !== null ? getTrafficLight(avgMonthly) : null;

  const trafficCard = (title: string, score: number | null, traffic: { color: string; bg: string; label: string; textColor: string } | null, icon: React.ReactNode) => (
    <div className={`rounded-lg border p-5 ${traffic?.bg ?? "bg-muted/30"}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon}
      </div>
      {score !== null && traffic ? (
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold" style={{ color: traffic.color }}>{score}</span>
          <div className="mb-1">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: traffic.color + "20", color: traffic.color }}
            >
              {traffic.label}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No data</p>
      )}
      <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        {score !== null && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, backgroundColor: traffic?.color ?? "#94a3b8" }}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {trafficCard("Daily Wellness Score", dailyScore, dailyTraffic, <Activity className="h-4 w-4 text-muted-foreground" />)}
        {trafficCard("Weekly Average", avgWeekly, weeklyTraffic, <TrendingUp className="h-4 w-4 text-muted-foreground" />)}
        {trafficCard("Monthly Average", avgMonthly, monthlyTraffic, <CalendarDays className="h-4 w-4 text-muted-foreground" />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4">Weekly Wellness Trend</h3>
          {weeklyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="wellness_score" stroke="#22c55e" fill="url(#weeklyGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No weekly data yet</p>
          )}
        </div>

        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4">Monthly Wellness Trend</h3>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={4} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="wellness_score" stroke="#3b82f6" fill="url(#monthlyGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No monthly data yet</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#22c55e20" }}>
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          </div>
          <div>
            <p className="text-sm font-medium">Green (75-100)</p>
            <p className="text-xs text-muted-foreground">Good — athlete is recovering well</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#eab30820" }}>
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: "#eab308" }} />
          </div>
          <div>
            <p className="text-sm font-medium">Yellow (50-74)</p>
            <p className="text-xs text-muted-foreground">Monitor — keep an eye on recovery</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "#ef444420" }}>
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          </div>
          <div>
            <p className="text-sm font-medium">Red (0-49)</p>
            <p className="text-xs text-muted-foreground">High risk — intervention needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
