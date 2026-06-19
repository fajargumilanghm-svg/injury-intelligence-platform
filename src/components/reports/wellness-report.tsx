"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { getWellnessReportData } from "@/lib/supabase/reports";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { downloadCSV, formatDate, printReport } from "@/lib/reports/export-utils";
import { Loader2, Download, Printer, Heart, Activity, Zap, BrainCircuit, Smile, Bed } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export function WellnessReport() {
  const { athleteId } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof getWellnessReportData>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (athleteId) loadData();
  }, [athleteId, fromDate, toDate]);

  async function loadData() {
    setIsLoading(true);
    const result = await getWellnessReportData(athleteId!, fromDate, toDate);
    setData(result);
    setIsLoading(false);
  }

  const trendData = useMemo(() => {
    if (!data) return [];
    return [...data.entries].reverse().map((e) => ({
      date: formatDate(e.submitted_at),
      wellness: e.wellness_score,
      sleep: e.sleep_quality * 10,
      mood: e.mood_state * 10,
      recovery: e.recovery_feeling * 10,
    }));
  }, [data]);

  const factors = [
    { key: "avgSleep" as const, label: "Sleep Quality", icon: Bed, color: "#3b82f6", value: data?.avgSleep },
    { key: "avgFatigue" as const, label: "Fatigue (inverted)", icon: Zap, color: "#f59e0b", value: data?.avgFatigue !== null ? 11 - (data?.avgFatigue ?? 0) : null },
    { key: "avgSoreness" as const, label: "Muscle Soreness (inverted)", icon: Activity, color: "#ef4444", value: data?.avgSoreness !== null ? 11 - (data?.avgSoreness ?? 0) : null },
    { key: "avgStress" as const, label: "Stress Level (inverted)", icon: BrainCircuit, color: "#8b5cf6", value: data?.avgStress !== null ? 11 - (data?.avgStress ?? 0) : null },
    { key: "avgMood" as const, label: "Mood State", icon: Smile, color: "#22c55e", value: data?.avgMood },
    { key: "avgRecovery" as const, label: "Recovery Feeling", icon: Heart, color: "#ec4899", value: data?.avgRecovery },
  ];

  function exportCSV() {
    if (!data) return;
    const headers = ["Date", "Wellness", "Sleep", "Fatigue", "Soreness", "Stress", "Mood", "Recovery"];
    const rows = data.entries.map((e) => [
      e.submitted_at, e.wellness_score, e.sleep_quality, e.fatigue,
      e.muscle_soreness, e.stress_level, e.mood_state, e.recovery_feeling,
    ]);
    downloadCSV("wellness-report", headers, rows);
  }

  if (!athleteId) {
    return <p className="text-center py-12 text-muted-foreground">Please set up your athlete profile first.</p>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Wellness Report</h2>
            <p className="text-sm text-muted-foreground">{data.totalEntries} entries recorded</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <DateRangePicker fromDate={fromDate} toDate={toDate} onChange={(f, t) => { setFromDate(f); setToDate(t); }} />
          <button onClick={exportCSV} className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs hover:bg-muted"><Download className="h-3.5 w-3.5 mr-1" /> CSV</button>
          <button onClick={printReport} className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs hover:bg-muted"><Printer className="h-3.5 w-3.5 mr-1" /> Print</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase">Avg Wellness</p>
          <p className="text-2xl font-bold mt-1">{data.avgWellness ?? "—"}</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-green-500" style={{ width: `${data.avgWellness ?? 0}%` }} /></div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase">Total Entries</p>
          <p className="text-2xl font-bold mt-1">{data.totalEntries}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase">Low Wellness Days</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{data.lowWellnessDays}</p>
          <p className="text-xs text-muted-foreground">{data.totalEntries > 0 ? Math.round((data.lowWellnessDays / data.totalEntries) * 100) : 0}% of entries</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase">Compliance</p>
          <p className="text-2xl font-bold mt-1">
            {(() => {
              if (fromDate && toDate) {
                const days = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1;
                return Math.min(100, Math.round((data.totalEntries / days) * 100));
              }
              return "—";
            })()}%
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Wellness Trend
          </h3>
          {trendData.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs><linearGradient id="wellGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="wellness" stroke="#22c55e" fill="url(#wellGrad)" strokeWidth={2} name="Wellness" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">Need more data points</p>}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">Component Averages</h3>
          <div className="space-y-3">
            {factors.map((f) => {
              const val = f.value !== null && f.value !== undefined ? (f.value / 10) * 100 : null;
              return (
                <div key={f.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <f.icon className="h-3.5 w-3.5" style={{ color: f.color }} />
                      <span className="text-xs">{f.label}</span>
                    </div>
                    <span className="text-xs font-medium tabular-nums" style={{ color: f.color }}>{val !== null ? `${Math.round(val)}%` : "—"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${val ?? 0}%`, backgroundColor: f.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
