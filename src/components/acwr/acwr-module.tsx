"use client";

import { useState, useEffect, useMemo } from "react";
import { getAcwrTrend, getAcwrAlerts, getTrainingEntries } from "@/lib/supabase/training";
import type { AcwrDataPoint, AcwrAlert, TrainingEntry } from "@/types";
import { Loader2, AlertTriangle, Info, ShieldAlert, TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from "recharts";

interface AcwrModuleProps {
  athleteId: string;
}

const riskConfig = {
  low: { label: "Undertraining", color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", range: "< 0.8" },
  optimal: { label: "Optimal", color: "#22c55e", bg: "bg-green-50", border: "border-green-200", text: "text-green-800", range: "0.8 – 1.3" },
  high: { label: "Elevated Risk", color: "#f97316", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", range: "1.3 – 1.5" },
  very_high: { label: "High Risk", color: "#ef4444", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", range: "> 1.5" },
};

export function AcwrModule({ athleteId }: AcwrModuleProps) {
  const [trend, setTrend] = useState<AcwrDataPoint[]>([]);
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  async function loadData() {
    const [trendData, entriesData] = await Promise.all([
      getAcwrTrend(athleteId, 60),
      getTrainingEntries(athleteId),
    ]);
    setTrend(trendData);
    setEntries(entriesData);
    setIsLoading(false);
  }

  const latest = trend.length > 0 ? trend[trend.length - 1] : null;
  const config = latest ? riskConfig[latest.risk_zone] : null;
  const alerts = useMemo(() => getAcwrAlerts(trend), [trend]);

  const weekEntries = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entries.filter(e => new Date(e.training_date) >= weekAgo);
  }, [entries]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!latest || entries.length < 7) {
    return (
      <div className="text-center py-20">
        <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">Insufficient Data</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          ACWR requires at least 7 days of training data to calculate. Log your training sessions consistently to unlock ACWR intelligence.
        </p>
      </div>
    );
  }

  const AlertIcon = (severity: string) => {
    switch (severity) {
      case "danger": return ShieldAlert;
      case "warning": return AlertTriangle;
      default: return Info;
    }
  };

  const alertBg = (severity: string) => {
    switch (severity) {
      case "danger": return "bg-red-50 border-red-200";
      case "warning": return "bg-amber-50 border-amber-200";
      default: return "bg-blue-50 border-blue-200";
    }
  };

  const alertIconColor = (severity: string) => {
    switch (severity) {
      case "danger": return "text-red-600";
      case "warning": return "text-amber-600";
      default: return "text-blue-600";
    }
  };

  const TrendIcon = () => {
    if (trend.length < 3) return null;
    const recent = trend.slice(-3);
    const dir = recent[2].acwr - recent[0].acwr;
    if (dir > 0.05) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (dir < -0.05) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`lg:col-span-2 rounded-xl border-2 p-6 ${config?.border} ${config?.bg}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Current ACWR</p>
              <p className="text-6xl font-bold tracking-tight" style={{ color: config?.color }}>
                {latest.acwr.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${config?.bg} ${config?.text}`}>
                {config?.label}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Range: {config?.range}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendIcon />
              <span className="text-muted-foreground">
                {trend.length >= 3 ? (
                  trend[trend.length - 1].acwr > trend[trend.length - 3].acwr ? "Trending up" :
                  trend[trend.length - 1].acwr < trend[trend.length - 3].acwr ? "Trending down" : "Stable"
                ) : ""}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/60 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Acute Load (7d)</p>
              <p className="text-2xl font-bold mt-1">{latest.acute_load}</p>
              <p className="text-xs text-muted-foreground">Average daily load over 7 days</p>
            </div>
            <div className="rounded-lg bg-white/60 p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Chronic Load (28d)</p>
              <p className="text-2xl font-bold mt-1">{latest.chronic_load}</p>
              <p className="text-xs text-muted-foreground">Average daily load over 28 days</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-white/40 p-3 text-center">
            <p className="text-sm font-mono">
              ACWR = <span className="font-bold" style={{ color: config?.color }}>{latest.acute_load}</span> ÷{" "}
              <span className="font-bold">{latest.chronic_load}</span> ={" "}
              <span className="font-bold" style={{ color: config?.color }}>{latest.acwr.toFixed(2)}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
              <Brain className="mx-auto h-8 w-8 mb-2" />
              No alerts generated
            </div>
          ) : (
            alerts.map((alert) => {
              const Icon = AlertIcon(alert.severity);
              return (
                <div key={alert.id} className={`rounded-lg border p-3 ${alertBg(alert.severity)}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${alertIconColor(alert.severity)}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-lg border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">ACWR Trend (60 Days)</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-amber-400" /> Under 0.8</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-green-500" /> Optimal 0.8–1.3</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-orange-500" /> Elevated 1.3–1.5</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-red-500" /> High &gt;1.5</span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="acwrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={7} />
              <YAxis domain={[0, 2.5]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value) => typeof value === "number" ? value.toFixed(2) : value}
              />
              <ReferenceLine y={0.8} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} />
              <ReferenceLine y={1.3} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={2} />
              <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
              <Area type="monotone" dataKey="acwr" stroke="#8b5cf6" fill="url(#acwrGrad)" strokeWidth={2.5} dot={false} name="ACWR" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4">Risk Zone Distribution</h3>
          {(() => {
            const counts = { low: 0, optimal: 0, high: 0, very_high: 0 };
            for (const p of trend) counts[p.risk_zone]++;
            const total = trend.length;
            const bars = [
              { key: "low" as const, label: "Under 0.8", color: "#f59e0b", count: counts.low },
              { key: "optimal" as const, label: "Optimal 0.8–1.3", color: "#22c55e", count: counts.optimal },
              { key: "high" as const, label: "Elevated 1.3–1.5", color: "#f97316", count: counts.high },
              { key: "very_high" as const, label: "High >1.5", color: "#ef4444", count: counts.very_high },
            ];
            return (
              <div className="space-y-3">
                {bars.map((bar) => (
                  <div key={bar.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bar.color }} />
                        {bar.label}
                      </span>
                      <span className="font-medium">{bar.count} days ({Math.round(bar.count / total * 100)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${bar.count / total * 100}%`, backgroundColor: bar.color }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="rounded-lg border p-5">
          <h3 className="text-sm font-medium mb-4">Recent Daily Breakdown</h3>
          {weekEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Load</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">Duration</th>
                    <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">RPE</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {weekEntries.slice(0, 14).map((e) => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="px-2 py-2 text-xs">{new Date(e.training_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</td>
                      <td className="px-2 py-2 text-right font-medium tabular-nums">{e.load_score}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{e.duration_minutes}m</td>
                      <td className="px-2 py-2 text-right tabular-nums">{e.intensity_rpe}</td>
                      <td className="px-2 py-2 text-xs capitalize">{e.training_type.replace(/_/g, " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No recent training entries</p>
          )}
        </div>
      </div>
    </div>
  );
}
