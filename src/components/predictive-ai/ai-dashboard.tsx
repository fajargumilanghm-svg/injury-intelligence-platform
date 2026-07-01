"use client";

import { useState, useEffect, useMemo } from "react";
import { predictInjuryRisk, type AIPrediction } from "@/lib/supabase/predictive-ai";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Loader2, BrainCircuit, TrendingUp, AlertTriangle, Lightbulb, BarChart3 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
  BarChart, Bar,
} from "recharts";

interface AiDashboardProps {
  athleteId: string;
}

export function AiDashboard({ athleteId }: AiDashboardProps) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPrediction();
  }, [athleteId]);

  async function loadPrediction() {
    const result = await predictInjuryRisk(athleteId);
    setPrediction(result);
    setIsLoading(false);
  }

  const factorChartData = useMemo(() => {
    if (!prediction) return [];
    return prediction.factors.map((f) => ({
      factor: f.label,
      score: f.value,
    }));
  }, [prediction]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!prediction) {
    return (
      <div className="text-center py-16">
        <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Insufficient Data</h3>
        <p className="text-sm text-muted-foreground">At least 7 days of wellness and training data required for risk prediction.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 flex flex-col items-center justify-center">
          <GaugeChart
            value={prediction.risk_score}
            min={0}
            max={100}
            size={180}
            label="Risk Score"
            thresholds={[
              { label: "Low", min: 0, max: 29, color: "#22c55e" },
              { label: "Moderate", min: 29, max: 54, color: "#f59e0b" },
              { label: "High", min: 54, max: 74, color: "#ef4444" },
              { label: "Very High", min: 74, max: 100, color: "#dc2626" },
            ]}
          />
          <div className="mt-2 text-center">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
              prediction.risk_level === "very_high" ? "bg-red-100 text-red-700" :
              prediction.risk_level === "high" ? "bg-orange-100 text-orange-700" :
              prediction.risk_level === "moderate" ? "bg-amber-100 text-amber-700" :
              "bg-green-100 text-green-700"
            }`}>
              {prediction.risk_level.replace(/_/g, " ").toUpperCase()}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Confidence: {prediction.confidence} &middot; P={prediction.probability.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> 4-Week Risk Projection
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={prediction.weeklyProjection}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="predictedRisk" stroke="#8b5cf6" fill="url(#projGrad)" strokeWidth={2} name="Predicted Risk" dot={{ r: 4 }} />
                <Area type="monotone" dataKey="upperBound" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" fill="none" name="Upper Bound" />
                <Area type="monotone" dataKey="lowerBound" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 4" fill="none" name="Lower Bound" />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Factor Analysis
          </h3>
          <div className="space-y-3">
            {prediction.factors.sort((a, b) => b.impact - a.impact).map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{f.label}</span>
                    <span className={`text-[10px] font-medium ${
                      f.trend === "declining" ? "text-red-600" :
                      f.trend === "improving" ? "text-green-600" :
                      "text-muted-foreground"
                    }`}>
                      {f.trend === "declining" ? "↓" : f.trend === "improving" ? "↑" : "→"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{(f.impact * 100).toFixed(0)}% weight</span>
                    <span className={`text-xs font-bold tabular-nums ${
                      f.value >= 55 ? "text-red-600" : f.value >= 30 ? "text-amber-600" : "text-green-600"
                    }`}>{f.value}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.value}%`,
                      backgroundColor: f.value >= 55 ? "#ef4444" : f.value >= 30 ? "#f59e0b" : "#22c55e",
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{f.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Insights & Recommendations
          </h3>
          <div className="space-y-2">
            {prediction.insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                  insight.includes("immediate") || insight.includes("exceeds") || insight.includes("spiked")
                    ? "border-red-200 bg-red-50 text-red-700"
                    : insight.includes("elevated") || insight.includes("declining") || insight.includes("moderate")
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                <AlertTriangle className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                  insight.includes("immediate") || insight.includes("exceeds") || insight.includes("spiked")
                    ? "text-red-500"
                    : insight.includes("elevated") || insight.includes("declining") || insight.includes("moderate")
                    ? "text-amber-500"
                    : "text-green-500"
                }`} />
                <span>{insight}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-foreground">Methodology:</strong> Weighted ensemble of 6 factors (Wellness Decline, Fatigue/Soreness, Sleep, Stress, ACWR Imbalance, Load Spike). Confidence based on data volume. Scores are deterministic — always validate with clinical assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
