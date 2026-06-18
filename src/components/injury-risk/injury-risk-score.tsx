"use client";

import { useState, useEffect } from "react";
import { calculateInjuryRisk, type InjuryRiskResult } from "@/lib/supabase/injury-risk";
import { GaugeChart } from "@/components/ui/gauge-chart";
import { Loader2, Shield, AlertTriangle, Info, Brain, Dumbbell, Moon, Activity, Heart, Wind } from "lucide-react";

interface InjuryRiskScoreProps {
  athleteId: string;
}

const riskConfig = {
  low: { label: "Low Risk", color: "#22c55e", bg: "bg-green-50", border: "border-green-200", text: "text-green-800", desc: "Athlete is in good condition. Continue current training program." },
  moderate: { label: "Moderate Risk", color: "#f59e0b", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", desc: "Some risk factors detected. Monitor closely and consider adjustments." },
  high: { label: "High Risk", color: "#ef4444", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", desc: "High injury risk. Intervention recommended — reduce load and prioritize recovery." },
};

const factorIcons: Record<string, React.ElementType> = {
  "Training Load": Dumbbell,
  "Fatigue": Activity,
  "Sleep Quality": Moon,
  "Muscle Soreness": Heart,
  "Injury History": Shield,
  "Flexibility Score": Wind,
};

export function InjuryRiskScore({ athleteId }: InjuryRiskScoreProps) {
  const [result, setResult] = useState<InjuryRiskResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRisk();
  }, [athleteId]);

  async function loadRisk() {
    const data = await calculateInjuryRisk(athleteId);
    setResult(data);
    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!result) {
    return (
      <div className="text-center py-20">
        <Brain className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">Insufficient Data</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Injury Risk Score requires training and wellness data. Log consistently to unlock your risk profile.
        </p>
      </div>
    );
  }

  const config = riskConfig[result.risk_level];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`rounded-xl border-2 p-4 flex items-center justify-center ${config.border} ${config.bg}`}>
          <div className="text-center">
            <GaugeChart
              value={result.overall_risk}
              min={0}
              max={100}
              size={240}
              label="Injury Risk Score"
              thresholds={[
                { label: "Low", min: 0, max: 39, color: "#22c55e" },
                { label: "Moderate", min: 39, max: 69, color: "#f59e0b" },
                { label: "High", min: 69, max: 100, color: "#ef4444" },
              ]}
            />
            <p className={`text-sm font-medium mt-2 ${config.text}`}>{config.desc}</p>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Risk Factor Breakdown
          </h3>
          <div className="space-y-4">
            {result.factors.map((f) => {
              const Icon = factorIcons[f.label];
              const severity = f.score <= 39 ? "good" : f.score <= 69 ? "monitor" : "bad";
              return (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium">{f.label}</span>
                      <span className="text-xs text-muted-foreground">({Math.round(f.weight * 100)}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{f.detail}</span>
                      <span className={`text-xs font-medium tabular-nums ${
                        severity === "bad" ? "text-red-600" : severity === "monitor" ? "text-amber-600" : "text-green-600"
                      }`}>
                        {f.score}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${f.score}%`,
                        backgroundColor:
                          severity === "bad" ? "#ef4444" :
                          severity === "monitor" ? "#f59e0b" : "#22c55e",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                    <span>Risk: {f.score}/100</span>
                    <span>Contribution: +{f.contribution}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {result.factors.map((f) => {
          const Icon = factorIcons[f.label];
          const barColor = f.score <= 39 ? "bg-green-500" : f.score <= 69 ? "bg-amber-500" : "bg-red-500";
          return (
            <div key={f.label} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <span className="text-xs font-medium">{f.label}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{Math.round(f.weight * 100)}%</span>
              </div>
              <p className="text-lg font-bold">{f.score}</p>
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${f.score}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{f.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="text-sm font-medium mb-4">Risk Score Calculation</h3>
        <div className="space-y-2">
          {result.factors.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-sm py-1 border-b border-dashed last:border-0">
              <span className="text-muted-foreground">
                {f.label} <span className="font-mono text-xs">({Math.round(f.weight * 100)}%)</span>
              </span>
              <span className="font-mono">
                {f.score} × {f.weight.toFixed(2)} = <span className="font-bold">+{f.contribution}</span>
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm pt-2 border-t-2">
            <span className="font-semibold">Total Risk Score</span>
            <span className="text-xl font-bold" style={{ color: config.color }}>
              {result.overall_risk} — {config.label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-lg border p-4 ${result.risk_level === "low" ? "bg-green-50 border-green-200" : "bg-card"}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Low Risk (0-39)</p>
              <p className="text-xs text-muted-foreground">Continue normal training</p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg border p-4 ${result.risk_level === "moderate" ? "bg-amber-50 border-amber-200" : "bg-card"}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Moderate Risk (40-69)</p>
              <p className="text-xs text-muted-foreground">Monitor and adjust</p>
            </div>
          </div>
        </div>
        <div className={`rounded-lg border p-4 ${result.risk_level === "high" ? "bg-red-50 border-red-200" : "bg-card"}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <span className="h-3 w-3 rounded-full bg-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium">High Risk (70-100)</p>
              <p className="text-xs text-muted-foreground">Intervention needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
