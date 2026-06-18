"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { getTrainingReportData } from "@/lib/supabase/reports";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { downloadCSV, formatDate, printReport } from "@/lib/reports/export-utils";
import { Loader2, Download, Printer, Dumbbell, Gauge, Timer, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export function TrainingReport() {
  const { profile } = useAuth();
  const athleteId = profile?.id;
  const [data, setData] = useState<Awaited<ReturnType<typeof getTrainingReportData>> | null>(null);
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
    const result = await getTrainingReportData(athleteId!, fromDate, toDate);
    setData(result);
    setIsLoading(false);
  }

  const loadTrend = useMemo(() => {
    if (!data) return [];
    return [...data.entries].reverse().map((e) => ({
      date: formatDate(e.training_date),
      load: e.load_score,
      intensity: e.intensity_rpe,
      duration: e.duration_minutes,
    }));
  }, [data]);

  function exportCSV() {
    if (!data) return;
    const headers = ["Date", "Type", "Duration (min)", "Intensity (RPE)", "Load (sRPE)", "Notes"];
    const rows = data.entries.map((e) => [
      e.training_date, e.training_type, e.duration_minutes, e.intensity_rpe, e.load_score, e.notes ?? "",
    ]);
    downloadCSV("training-report", headers, rows);
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
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Training Load Report</h2>
            <p className="text-sm text-muted-foreground">{data.totalSessions} sessions</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <DateRangePicker fromDate={fromDate} toDate={toDate} onChange={(f, t) => { setFromDate(f); setToDate(t); }} />
          <button onClick={exportCSV} className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs hover:bg-muted"><Download className="h-3.5 w-3.5 mr-1" /> CSV</button>
          <button onClick={printReport} className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs hover:bg-muted"><Printer className="h-3.5 w-3.5 mr-1" /> Print</button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Sessions</p>
          <p className="text-2xl font-bold mt-1">{data.totalSessions}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Load</p>
          <p className="text-2xl font-bold mt-1">{data.totalLoad.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Load/Session</p>
          <p className="text-2xl font-bold mt-1">{data.avgLoad ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Intensity</p>
          <p className="text-2xl font-bold mt-1">{data.avgIntensity ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">ACWR</p>
          <p className="text-2xl font-bold mt-1">{data.acwr ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Training Load Trend
          </h3>
          {loadTrend.length > 1 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loadTrend}>
                  <defs><linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="load" stroke="#3b82f6" fill="url(#loadGrad)" strokeWidth={2} name="sRPE" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">Insufficient data</p>}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">By Training Type</h3>
          {data.byType.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byType} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <YAxis dataKey="training_type" type="category" tick={{ fontSize: 9 }} className="text-muted-foreground" width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No sessions</p>}
        </div>
      </div>
    </div>
  );
}
