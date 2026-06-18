"use client";

import { useState, useEffect, useMemo } from "react";
import { getInjuryReportData } from "@/lib/supabase/reports";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { downloadCSV, formatDate, printReport } from "@/lib/reports/export-utils";
import { Loader2, Download, Printer, Activity, AlertTriangle, CalendarDays, Timer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function InjuryReport() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getInjuryReportData>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  async function loadData() {
    setIsLoading(true);
    const result = await getInjuryReportData(fromDate, toDate);
    setData(result);
    setIsLoading(false);
  }

  const SEVERITY_COLORS: Record<string, string> = {
    minor: "#22c55e", moderate: "#f59e0b", severe: "#ef4444",
  };

  const MECHANISM_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

  function exportCSV() {
    if (!data) return;
    const headers = ["Date", "Type", "Location", "Severity", "Mechanism", "Side", "Status", "Est. Days", "Actual Days"];
    const rows = data.injuries.map((i) => [
      i.injury_date, i.injury_type, i.body_part, i.severity,
      i.mechanism ?? "", i.side, i.status,
      i.estimated_recovery_days ?? "", i.actual_recovery_days ?? "",
    ]);
    downloadCSV("injury-analysis", headers, rows);
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
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Injury Analysis Report</h2>
            <p className="text-sm text-muted-foreground">{data.totalInjuries} total injuries recorded</p>
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
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-red-600" /><span className="text-xs text-muted-foreground">Total Injuries</span></div>
          <p className="text-2xl font-bold mt-1">{data.totalInjuries}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><span className="text-xs text-muted-foreground">Severe Injuries</span></div>
          <p className="text-2xl font-bold mt-1">{data.bySeverity.find((s) => s.name === "severe")?.count ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-blue-600" /><span className="text-xs text-muted-foreground">Avg Est Recovery</span></div>
          <p className="text-2xl font-bold mt-1">{data.avgEstRecoveryDays ?? "—"}<span className="text-sm font-normal text-muted-foreground">d</span></p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-green-600" /><span className="text-xs text-muted-foreground">Avg Actual Recovery</span></div>
          <p className="text-2xl font-bold mt-1">{data.avgRecoveryDays ?? "—"}<span className="text-sm font-normal text-muted-foreground">d</span></p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">By Injury Type</h3>
          {data.byType.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byType} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} className="text-muted-foreground" width={90} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No data</p>}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">By Body Part</h3>
          {data.byBodyPart.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byBodyPart} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} className="text-muted-foreground" width={70} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No data</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">By Severity</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.bySeverity} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                  {data.bySeverity.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] ?? "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">By Mechanism</h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.byMechanism} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                  {data.byMechanism.map((_, i) => (
                    <Cell key={i} fill={MECHANISM_COLORS[i % MECHANISM_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
