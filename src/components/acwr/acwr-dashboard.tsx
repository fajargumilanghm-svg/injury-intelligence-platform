"use client";

import { useState, useEffect, useMemo } from "react";
import { getAcwrTrend, getAcwrAlerts } from "@/lib/supabase/training";
import { getWellnessTrend } from "@/lib/supabase/wellness";
import { GaugeChart } from "@/components/ui/gauge-chart";
import type { AcwrDataPoint, AcwrAlert, WellnessTrend } from "@/types";
import { Loader2, TrendingUp, TrendingDown, Minus, Shield, AlertTriangle, Info, Activity } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine,
} from "recharts";

interface AcwrDashboardProps {
  athleteId: string;
}

export function AcwrDashboard({ athleteId }: AcwrDashboardProps) {
  const [trend, setTrend] = useState<AcwrDataPoint[]>([]);
  const [wellnessTrend, setWellnessTrend] = useState<WellnessTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  async function loadData() {
    const [trendData, wellness] = await Promise.all([
      getAcwrTrend(athleteId, 60),
      getWellnessTrend(athleteId, 14),
    ]);
    setTrend(trendData);
    setWellnessTrend(wellness);
    setIsLoading(false);
  }

  const latest = trend.length > 0 ? trend[trend.length - 1] : null;
  const weeklyTrend = trend.slice(-7);
  const alerts = useMemo(() => getAcwrAlerts(trend), [trend]);

  const riskConfig = {
    low: { label: "Undertraining", color: "#f59e0b", bg: "bg-amber-50", text: "text-amber-800" },
    optimal: { label: "Optimal", color: "#22c55e", bg: "bg-green-50", text: "text-green-800" },
    high: { label: "Elevated Risk", color: "#f97316", bg: "bg-orange-50", text: "text-orange-800" },
    very_high: { label: "High Risk", color: "#ef4444", bg: "bg-red-50", text: "text-red-800" },
  };

  const riskFactors = useMemo(() => {
    if (!latest || trend.length < 7) return [];

    const factors: { label: string; status: "good" | "monitor" | "bad"; detail: string }[] = [];

    const config = riskConfig[latest.risk_zone];
    factors.push({
      label: "ACWR Status",
      status: latest.risk_zone === "optimal" ? "good" : latest.risk_zone === "low" ? "monitor" : "bad",
      detail: `${latest.acwr.toFixed(2)} — ${config.label}`,
    });

    const acwrTrend7 = trend.slice(-7);
    const upward = acwrTrend7[acwrTrend7.length - 1].acwr > acwrTrend7[0].acwr;
    factors.push({
      label: "Weekly ACWR Trend",
      status: upward && latest.risk_zone !== "optimal" ? "bad" : "good",
      detail: upward ? "Increasing" : "Stable or decreasing",
    });

    const acuteLoad = latest.acute_load;
    factors.push({
      label: "Acute Load (7d avg)",
      status: acuteLoad > 500 ? "bad" : acuteLoad > 300 ? "monitor" : "good",
      detail: `${acuteLoad} per day`,
    });

    const wellnessAvg = wellnessTrend.length > 0
      ? Math.round(wellnessTrend.reduce((s, w) => s + w.wellness_score, 0) / wellnessTrend.length)
      : null;
    if (wellnessAvg !== null) {
      factors.push({
        label: "Wellness Score (avg)",
        status: wellnessAvg >= 75 ? "good" : wellnessAvg >= 50 ? "monitor" : "bad",
        detail: `${wellnessAvg}/100`,
      });
    }

    const alertsActive = alerts.filter((a) => a.severity === "danger" || a.severity === "warning").length;
    factors.push({
      label: "Active Alerts",
      status: alertsActive > 2 ? "bad" : alertsActive > 0 ? "monitor" : "good",
      detail: `${alertsActive} active alert${alertsActive !== 1 ? "s" : ""}`,
    });

    return factors;
  }, [latest, trend, wellnessTrend, alerts]);

  const TrendIcon = () => {
    if (trend.length < 3) return null;
    const recent = trend.slice(-3);
    const dir = recent[2].acwr - recent[0].acwr;
    if (dir > 0.05) return <TrendingUp className="h-5 w-5 text-red-500" />;
    if (dir < -0.05) return <TrendingDown className="h-5 w-5 text-green-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!latest) {
    return (
      <div className="text-center py-20">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Data</h3>
        <p className="text-sm text-muted-foreground">Log training sessions to see ACWR data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 flex items-center justify-center">
          <GaugeChart value={latest.acwr} size={240} label="Current ACWR" />
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Weekly Trend
          </h3>
          {weeklyTrend.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="wTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <YAxis domain={[0, 2.5]} tick={{ fontSize: 9 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => typeof v === "number" ? v.toFixed(2) : v} />
                  <ReferenceLine y={0.8} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1.5} />
                  <ReferenceLine y={1.3} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1.5} />
                  <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="acwr" stroke="#8b5cf6" fill="url(#wTrendGrad)" strokeWidth={2} dot={{ r: 3 }} name="ACWR" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No weekly data</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground border-t pt-3">
            <span>Range: {weeklyTrend.length > 0 ? `${weeklyTrend[0]?.date} – ${weeklyTrend[weeklyTrend.length - 1]?.date}` : "—"}</span>
            <span className="flex items-center gap-1"><TrendIcon /> ACWR trend</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Risk Status
          </h3>
          <div className="space-y-3">
            {riskFactors.map((f) => {
              const dotColor = f.status === "good" ? "bg-green-500" : f.status === "monitor" ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={f.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${dotColor}`} />
                    <span className="text-sm">{f.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{f.detail}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4">ACWR Trend (60 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="fullGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={7} />
              <YAxis domain={[0, 2.5]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => typeof v === "number" ? v.toFixed(2) : v} />
              <ReferenceLine y={0.8} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={2} />
              <ReferenceLine y={1.3} stroke="#22c55e" strokeDasharray="4 4" strokeWidth={2} />
              <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} />
              <Area type="monotone" dataKey="acwr" stroke="#8b5cf6" fill="url(#fullGrad)" strokeWidth={2} dot={false} name="ACWR" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-amber-400" /> Under 0.8</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-green-500" /> Optimal 0.8–1.3</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-orange-500" /> Elevated 1.3–1.5</span>
          <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-red-500" /> High &gt;1.5</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4">Active Alerts</h3>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const Icon = alert.severity === "danger" ? Shield : alert.severity === "warning" ? AlertTriangle : Info;
              const borderColor = alert.severity === "danger" ? "border-red-200 bg-red-50" : alert.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50";
              return (
                <div key={alert.id} className={`rounded-lg border p-3 ${borderColor}`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${alert.severity === "danger" ? "text-red-600" : alert.severity === "warning" ? "text-amber-600" : "text-blue-600"}`} />
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
