"use client";

import { useState, useEffect } from "react";
import { getPredictiveAnalytics } from "@/lib/supabase/predictive-analytics";
import type { PredictiveAnalytics as AnalyticsData } from "@/types";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Loader2, BrainCircuit, TrendingUp, BarChart3, Activity, ShieldAlert, Table } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from "recharts";

interface AnalyticsDashboardProps {
  athleteId: string;
}

const riskColors: Record<string, string> = {
  low: "#22c55e",
  moderate: "#f59e0b",
  high: "#ef4444",
  very_high: "#dc2626",
};

const riskBg: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  very_high: "bg-red-100 text-red-700",
};

export function AnalyticsDashboard({ athleteId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    load();
  }, [athleteId]);

  async function load() {
    const result = await getPredictiveAnalytics(athleteId);
    setData(result);
    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Insufficient Data</h3>
        <p className="text-sm text-muted-foreground">Wellness and training data required for predictive analytics.</p>
      </div>
    );
  }

  const ensemble = data.ensemble;
  const horizonData = [
    { horizon: "7-Day", probability: ensemble.probability_7d, risk: ensemble.risk_level_7d },
    { horizon: "14-Day", probability: ensemble.probability_14d, risk: ensemble.risk_level_14d },
    { horizon: "30-Day", probability: ensemble.probability_30d, risk: ensemble.risk_level_30d },
  ];

  const modelChartData = data.models.map((m) => ({
    model: m.model_name,
    "7-Day": m.probability_7d,
    "14-Day": m.probability_14d,
    "30-Day": m.probability_30d,
  }));

  const inputItems = [
    { label: "Wellness Score", value: data.inputs.wellness_score, max: 100, unit: "", good: data.inputs.wellness_score >= 70 },
    { label: "ACWR", value: data.inputs.acwr, max: 3, unit: "", good: data.inputs.acwr >= 0.8 && data.inputs.acwr <= 1.3 },
    { label: "FMS Score", value: data.inputs.fms_total ?? "—", max: 21, unit: "", good: data.inputs.fms_total !== null && data.inputs.fms_total >= 14 },
    { label: "Injury History", value: data.inputs.injury_history_score, max: 100, unit: "%", good: data.inputs.injury_history_score < 30 },
    { label: "Training Load", value: data.inputs.training_load, max: 2000, unit: "au", good: data.inputs.training_load < 800 },
    { label: "Age", value: data.inputs.age, max: 50, unit: "yrs", good: data.inputs.age < 30 },
    { label: "Playing Time Risk", value: data.inputs.playing_time_score, max: 100, unit: "%", good: data.inputs.playing_time_score < 50 },
  ];

  return (
    <div className="space-y-6">
      {/* Input Cards */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Input Factors
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {inputItems.map((item) => (
            <div key={item.label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${item.good ? "text-green-600" : "text-amber-600"}`}>
                {item.value}{item.unit}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Ensemble Predictions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {horizonData.map((h) => (
          <div key={h.horizon} className="rounded-xl border bg-card p-5 flex flex-col items-center">
            <GaugeChart
              value={h.probability}
              min={0}
              max={100}
              size={160}
              label={h.horizon}
              thresholds={[
                { label: "Low", min: 0, max: 19, color: "#22c55e" },
                { label: "Moderate", min: 19, max: 44, color: "#f59e0b" },
                { label: "High", min: 44, max: 69, color: "#ef4444" },
                { label: "Very High", min: 69, max: 100, color: "#dc2626" },
              ]}
            />
            <div className="mt-2 text-center">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${riskBg[h.risk]}`}>
                {h.risk.replace(/_/g, " ").toUpperCase()}
              </span>
              <p className="text-xs text-muted-foreground mt-1">P = {h.probability}%</p>
            </div>
          </div>
        ))}
      </div>

      {/* Model Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Model Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="model" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="7-Day" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="14-Day" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="30-Day" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Top Contributing Factors
          </h3>
          <div className="space-y-3">
            {data.models[0].feature_importance
              .sort((a, b) => b.importance - a.importance)
              .slice(0, 5)
              .map((f) => (
                <div key={f.feature}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{f.feature}</span>
                    <span className="text-xs text-muted-foreground">{f.importance}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500"
                      style={{ width: `${f.importance}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Model Details Table */}
      <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Table className="h-4 w-4 text-primary" /> Risk Factor Analysis
          </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Model</th>
                <th className="text-right px-2 py-2 font-medium">7-Day</th>
                <th className="text-right px-2 py-2 font-medium">14-Day</th>
                <th className="text-right px-2 py-2 font-medium">30-Day</th>
                <th className="text-left pl-4 py-2 font-medium">Top Feature</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map((m) => {
                const topFeature = m.feature_importance.sort((a, b) => b.importance - a.importance)[0];
                return (
                  <tr key={m.model_name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{m.model_name}</td>
                    <td className={`text-right px-2 py-2 font-bold tabular-nums ${
                      m.probability_7d >= 44 ? "text-red-600" : m.probability_7d >= 19 ? "text-amber-600" : "text-green-600"
                    }`}>{m.probability_7d}%</td>
                    <td className={`text-right px-2 py-2 font-bold tabular-nums ${
                      m.probability_14d >= 44 ? "text-red-600" : m.probability_14d >= 19 ? "text-amber-600" : "text-green-600"
                    }`}>{m.probability_14d}%</td>
                    <td className={`text-right px-2 py-2 font-bold tabular-nums ${
                      m.probability_30d >= 44 ? "text-red-600" : m.probability_30d >= 19 ? "text-amber-600" : "text-green-600"
                    }`}>{m.probability_30d}%</td>
                    <td className="pl-4 py-2 text-muted-foreground">{topFeature.feature} ({topFeature.importance}%)</td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-foreground/20 font-semibold">
                <td className="py-2 pr-4">Ensemble (avg)</td>
                <td className={`text-right px-2 py-2 tabular-nums ${
                  ensemble.probability_7d >= 44 ? "text-red-600" : ensemble.probability_7d >= 19 ? "text-amber-600" : "text-green-600"
                }`}>{ensemble.probability_7d}%</td>
                <td className={`text-right px-2 py-2 tabular-nums ${
                  ensemble.probability_14d >= 44 ? "text-red-600" : ensemble.probability_14d >= 19 ? "text-amber-600" : "text-green-600"
                }`}>{ensemble.probability_14d}%</td>
                <td className={`text-right px-2 py-2 tabular-nums ${
                  ensemble.probability_30d >= 44 ? "text-red-600" : ensemble.probability_30d >= 19 ? "text-amber-600" : "text-green-600"
                }`}>{ensemble.probability_30d}%</td>
                <td className="pl-4 py-2 text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" /> Scoring Methodology
        </h3>
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold mb-1">Risk Analysis</p>
          <p className="text-[10px] text-muted-foreground">Weighted rule-based scoring using 5 factors: Acute:Chronic Ratio (30%), Fatigue Level (25%), Sleep Quality (20%), Recent Injury Severity (15%), Training Load Trend (10%). Scores are projected across 7, 14, and 30-day windows with deterministic adjustments.</p>
        </div>
        <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[10px] text-muted-foreground">
            <strong className="text-foreground">Note:</strong> This is a rule-based risk assessment engine. Scores are calculated deterministically from athlete wellness and training data without stochastic or machine learning components.
          </p>
        </div>
      </div>
    </div>
  );
}
