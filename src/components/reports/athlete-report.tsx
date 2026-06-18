"use client";

import { useState, useEffect, useMemo } from "react";
import { getAthleteReportData } from "@/lib/supabase/reports";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { downloadCSV, formatDate, printReport } from "@/lib/reports/export-utils";
import { Loader2, Download, Printer, User, Activity, Dumbbell, Stethoscope, Heart, Gauge, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AthleteReportProps {
  athleteId: string;
}

export function AthleteReport({ athleteId }: AthleteReportProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getAthleteReportData>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();
  }, [athleteId, fromDate, toDate]);

  async function loadData() {
    setIsLoading(true);
    const result = await getAthleteReportData(athleteId, fromDate, toDate);
    setData(result);
    setIsLoading(false);
  }

  const wellnessChartData = useMemo(() => {
    if (!data) return [];
    const reversed = [...data.wellnessEntries].reverse();
    return reversed.map((e) => ({
      date: formatDate(e.submitted_at),
      wellness: e.wellness_score,
      sleep: e.sleep_quality * 10,
      mood: e.mood_state * 10,
    }));
  }, [data]);

  const trainingChartData = useMemo(() => {
    if (!data) return [];
    const reversed = [...data.trainingEntries].reverse();
    return reversed.map((e) => ({
      date: formatDate(e.training_date),
      load: e.load_score,
      type: e.training_type,
    }));
  }, [data]);

  function exportCSV() {
    if (!data) return;
    const headers = ["Date", "Wellness", "Sleep Quality", "Fatigue", "Soreness", "Stress", "Mood", "Recovery"];
    const rows = data.wellnessEntries.map((e) => [
      e.submitted_at, e.wellness_score, e.sleep_quality, e.fatigue,
      e.muscle_soreness, e.stress_level, e.mood_state, e.recovery_feeling,
    ]);
    downloadCSV("athlete-wellness-report", headers, rows);
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data?.athlete) {
    return <p className="text-center py-12 text-muted-foreground">Athlete not found.</p>;
  }

  const { athlete, avgWellness, avgLoad, acwr, totalSessions, injuries } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{athlete.full_name}</h2>
            <p className="text-sm text-muted-foreground">{athlete.sport} &middot; {athlete.playing_position}</p>
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
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-green-600" />
            <span className="text-xs text-muted-foreground">Avg Wellness</span>
          </div>
          <p className="text-2xl font-bold mt-1">{avgWellness ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{data.wellnessEntries.length} entries</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">Avg Load</span>
          </div>
          <p className="text-2xl font-bold mt-1">{avgLoad ?? "—"}</p>
          <p className="text-xs text-muted-foreground">{totalSessions} sessions</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-muted-foreground">ACWR</span>
          </div>
          <p className="text-2xl font-bold mt-1">{acwr ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-red-600" />
            <span className="text-xs text-muted-foreground">Injuries</span>
          </div>
          <p className="text-2xl font-bold mt-1">{injuries.length}</p>
          <p className="text-xs text-muted-foreground">{injuries.filter((i) => i.status === "active").length} active</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Wellness Trend
          </h3>
          {wellnessChartData.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wellnessChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="wellness" fill="#22c55e" radius={[4, 4, 0, 0]} name="Wellness" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">Insufficient data</p>}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Training Load
          </h3>
          {trainingChartData.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trainingChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="load" fill="#2563eb" radius={[4, 4, 0, 0]} name="sRPE Load" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">Insufficient data</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4">Injury History</h3>
        {injuries.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Location</th>
                <th className="px-3 py-2 text-left">Severity</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Recovery</th>
              </tr>
            </thead>
            <tbody>
              {injuries.map((i) => (
                <tr key={i.id} className="border-b hover:bg-muted/50">
                  <td className="px-3 py-2">{formatDate(i.injury_date)}</td>
                  <td className="px-3 py-2 font-medium">{i.injury_type}</td>
                  <td className="px-3 py-2">{i.body_part}</td>
                  <td className="px-3 py-2 capitalize">{i.severity}</td>
                  <td className="px-3 py-2 capitalize">{i.status}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{i.actual_recovery_days ? `${i.actual_recovery_days}d` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No injuries recorded.</p>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground text-right print:block hidden">
        Generated {new Date().toLocaleDateString()} &middot; Injury Intelligence Platform
      </div>
    </div>
  );
}
