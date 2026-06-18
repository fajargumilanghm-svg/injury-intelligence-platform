"use client";

import { useState, useEffect, useMemo } from "react";
import { getTeamReportData } from "@/lib/supabase/reports";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { downloadCSV, printReport } from "@/lib/reports/export-utils";
import { Loader2, Download, Printer, Users, Activity, Gauge, Heart, TrendingUp, Shield } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function TeamReport() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getTeamReportData>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    loadData();
  }, [fromDate, toDate]);

  async function loadData() {
    setIsLoading(true);
    const result = await getTeamReportData(fromDate, toDate);
    setData(result);
    setIsLoading(false);
  }

  const statusData = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.allInjuries.forEach((i) => map.set(i.status, (map.get(i.status) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [data]);

  const STATUS_COLORS: Record<string, string> = {
    active: "#ef4444", recovering: "#f59e0b", recovered: "#22c55e", chronic: "#a855f7",
  };

  function exportCSV() {
    if (!data) return;
    const headers = ["Athlete", "Injuries", "Status", "Severity", "Date"];
    const rows = data.allInjuries.map((i) => [
      i.athlete_name ?? "—", i.injury_type, i.status, i.severity, i.injury_date,
    ]);
    downloadCSV("team-report", headers, rows);
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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Team Report</h2>
            <p className="text-sm text-muted-foreground">{data.totalAthletes} athletes tracked</p>
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
          <p className="text-xs text-muted-foreground">Total Athletes</p>
          <p className="text-2xl font-bold mt-1">{data.totalAthletes}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Injuries</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{data.activeInjuries}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Wellness</p>
          <p className="text-2xl font-bold mt-1">{data.avgWellness ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg ACWR</p>
          <p className="text-2xl font-bold mt-1">{data.avgAcwr ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recovery Rate</p>
          <p className="text-2xl font-bold mt-1">{data.recoveryRate ?? "—"}%</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Injury Status Distribution
          </h3>
          {statusData.length > 0 ? (
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No data</p>}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Key Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Wellness Coverage</span><span className="text-muted-foreground">{data.avgWellness ?? "—"}/100</span></div>
              <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-green-500" style={{ width: `${data.avgWellness ?? 0}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>ACWR Balance</span><span className="text-muted-foreground">{data.avgAcwr ?? "—"}</span></div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full" style={{
                  width: `${Math.min((data.avgAcwr ?? 1) / 2.5 * 100, 100)}%`,
                  backgroundColor: (data.avgAcwr ?? 1) >= 1.3 ? "#ef4444" : (data.avgAcwr ?? 1) <= 0.8 ? "#f59e0b" : "#22c55e",
                }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Recovery Rate</span><span className="text-muted-foreground">{data.recoveryRate ?? "—"}%</span></div>
              <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-blue-500" style={{ width: `${data.recoveryRate ?? 0}%` }} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4">All Injuries</h3>
        {data.allInjuries.length > 0 ? (
          <table className="w-full text-xs">
            <thead><tr className="border-b bg-muted/50"><th className="px-3 py-2 text-left">Athlete</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Location</th><th className="px-3 py-2 text-left">Severity</th><th className="px-3 py-2 text-left">Status</th><th className="px-3 py-2 text-left">Date</th></tr></thead>
            <tbody>
              {data.allInjuries.slice(0, 20).map((i) => (
                <tr key={i.id} className="border-b hover:bg-muted/50">
                  <td className="px-3 py-2">{(i as unknown as Record<string, string>).athlete_name ?? "—"}</td>
                  <td className="px-3 py-2 font-medium">{i.injury_type}</td>
                  <td className="px-3 py-2">{i.body_part}</td>
                  <td className="px-3 py-2 capitalize">{i.severity}</td>
                  <td className="px-3 py-2 capitalize">{i.status}</td>
                  <td className="px-3 py-2">{i.injury_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-muted-foreground text-center py-4">No injuries.</p>}
      </div>
    </div>
  );
}
