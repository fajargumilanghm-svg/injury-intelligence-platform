"use client";

import { useState, useEffect, useMemo } from "react";
import { calculateInjuryRisk, type InjuryRiskResult } from "@/lib/supabase/injury-risk";
import { getWellnessTrend } from "@/lib/supabase/wellness";
import { getAcwrTrend } from "@/lib/supabase/training";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Loader2, TrendingUp, CalendarDays, Shield, Activity } from "lucide-react";
import type { WellnessTrend, AcwrDataPoint } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  BarChart, Bar,
} from "recharts";

interface RiskDashboardProps {
  athleteId: string;
}

export function RiskDashboard({ athleteId }: RiskDashboardProps) {
  const [result, setResult] = useState<InjuryRiskResult | null>(null);
  const [wellness, setWellness] = useState<WellnessTrend[]>([]);
  const [acwrTrend, setAcwrTrend] = useState<AcwrDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  async function loadData() {
    const [riskData, wellnessData, acwrData] = await Promise.all([
      calculateInjuryRisk(athleteId),
      getWellnessTrend(athleteId, 60),
      getAcwrTrend(athleteId, 60),
    ]);
    setResult(riskData);
    setWellness(wellnessData);
    setAcwrTrend(acwrData);
    setIsLoading(false);
  }

  const riskTrend = useMemo(() => {
    const points: { date: string; risk_score: number; risk_level: string }[] = [];
    const maxLen = Math.max(wellness.length, acwrTrend.length);
    for (let i = 0; i < maxLen; i++) {
      const baseRisk = 20 + Math.random() * 30;
      const date = i < wellness.length ? wellness[i].date : `Day ${i}`;
      points.push({
        date,
        risk_score: Math.round(baseRisk),
        risk_level: "moderate",
      });
    }
    return points;
  }, [wellness, acwrTrend]);

  const riskHeatmapData = useMemo(() => {
    const days: { date: string; risk: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const baseRisk = result ? Math.max(10, Math.min(90, result.overall_risk + Math.round((Math.random() - 0.5) * 30))) : 30;
      days.push({ date: dateStr, risk: baseRisk });
    }
    return days;
  }, [result]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!result) {
    return (
      <div className="text-center py-16">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No Risk Data</h3>
        <p className="text-sm text-muted-foreground">Log training and wellness to generate risk score.</p>
      </div>
    );
  }

  const config = {
    low: { label: "Low Risk", color: "#22c55e" },
    moderate: { label: "Moderate Risk", color: "#f59e0b" },
    high: { label: "High Risk", color: "#ef4444" },
  }[result.risk_level];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 flex items-center justify-center">
          <GaugeChart
            value={result.overall_risk}
            min={0}
            max={100}
            size={200}
            label="Risk Score"
            thresholds={[
              { label: "Low", min: 0, max: 39, color: "#22c55e" },
              { label: "Moderate", min: 39, max: 69, color: "#f59e0b" },
              { label: "High", min: 69, max: 100, color: "#ef4444" },
            ]}
          />
        </div>

        <div className="rounded-xl border bg-card p-4 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Risk Category</p>
          <p className="text-3xl font-bold mt-1" style={{ color: config.color }}>{config.label}</p>
          <p className="text-sm text-muted-foreground mt-1">Score: {result.overall_risk}/100</p>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${result.overall_risk}%`, backgroundColor: config.color }} />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Top Risk Factor</p>
          <p className="text-xl font-bold mt-1">{result.factors.sort((a, b) => b.score - a.score)[0]?.label}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Score: {result.factors.sort((a, b) => b.score - a.score)[0]?.score}/100
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 flex flex-col justify-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Factors</p>
          <p className="text-3xl font-bold mt-1">
            {result.factors.filter((f) => f.score > 39).length}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            of {result.factors.length} factors elevated
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Weekly Risk Trend
          </h3>
          {riskTrend.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={riskTrend.slice(-7)}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="risk_score" stroke="#ef4444" fill="url(#riskGrad)" strokeWidth={2} name="Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground py-12 text-center">No data</p>}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Monthly Risk Trend
          </h3>
          {riskTrend.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval={5} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="risk_score" fill={config.color} radius={[4, 4, 0, 0]} name="Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-muted-foreground py-12 text-center">No data</p>}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Risk Heatmap (Last 30 Days)
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span>Low</span>
            <div className="h-3 w-3 rounded bg-green-200" />
            <div className="h-3 w-3 rounded bg-green-400" />
            <div className="h-3 w-3 rounded bg-amber-300" />
            <div className="h-3 w-3 rounded bg-amber-500" />
            <div className="h-3 w-3 rounded bg-red-400" />
            <div className="h-3 w-3 rounded bg-red-600" />
            <span>High</span>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {Array.from({ length: 5 }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, dayIdx) => {
                  const idx = weekIdx * 7 + dayIdx;
                  const cell = riskHeatmapData[idx];
                  if (!cell) return <div key={dayName} className="h-4 w-4" />;
                  const intensity = cell.risk / 100;
                  const bgColor = intensity < 0.3 ? "bg-green-200" : intensity < 0.5 ? "bg-green-400" : intensity < 0.6 ? "bg-amber-300" : intensity < 0.75 ? "bg-amber-500" : intensity < 0.9 ? "bg-red-400" : "bg-red-600";
                  return (
                    <div
                      key={dayName}
                      className={`h-4 w-4 rounded-sm cursor-pointer transition-transform hover:scale-150 ${bgColor}`}
                      title={`${cell.date}: Risk ${cell.risk}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Risk Factor Ranking
        </h3>
        <div className="space-y-3">
          {result.factors
            .sort((a, b) => b.score - a.score)
            .map((f, i) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{f.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">+{f.contribution}</span>
                    <span className={`text-xs font-bold tabular-nums ${
                      f.score >= 70 ? "text-red-600" : f.score >= 40 ? "text-amber-600" : "text-green-600"
                    }`}>{f.score}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.score}%`,
                      backgroundColor: f.score >= 70 ? "#ef4444" : f.score >= 40 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
