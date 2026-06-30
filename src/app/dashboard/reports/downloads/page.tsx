"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getWellnessReportData } from "@/lib/supabase/reports";
import { getTrainingEntries } from "@/lib/supabase/training";
import { calculateInjuryRisk } from "@/lib/supabase/injury-risk";
import { getInjuries } from "@/lib/supabase/injuries";
import { generateWellnessPdf, generateTrainingPdf, generateInjuryRiskPdf, generateInjuryManagementPdf } from "@/lib/reports/pdf-utils";
import { generateWellnessExcel, generateTrainingExcel, generateInjuryRiskExcel, generateInjuryManagementExcel } from "@/lib/reports/excel-utils";
import { Loader2, Download, FileText, FileSpreadsheet, Activity, Dumbbell, Shield, Stethoscope } from "lucide-react";
import type { InjuryRiskResult } from "@/lib/supabase/injury-risk";

const reportTypes = [
  { key: "wellness", label: "Wellness Report", icon: Activity, color: "text-green-600", bg: "bg-green-100", desc: "Wellness scores, sleep, fatigue, stress, mood, and recovery data" },
  { key: "training", label: "Training Load Report", icon: Dumbbell, color: "text-blue-600", bg: "bg-blue-100", desc: "Session details, load scores, intensity, and duration" },
  { key: "risk", label: "Injury Risk Report", icon: Shield, color: "text-purple-600", bg: "bg-purple-100", desc: "Risk score, factor breakdown, weights, and contribution analysis" },
  { key: "injury", label: "Injury Management Report", icon: Stethoscope, color: "text-red-600", bg: "bg-red-100", desc: "Injury history, severity, recovery status, and treatment notes" },
];

export default function DownloadsPage() {
  const { profile, athleteId } = useAuth();
  const athleteName = profile?.full_name ?? "Athlete";
  const [isLoading, setIsLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const [wellnessData, setWellnessData] = useState<any[]>([]);
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<InjuryRiskResult | null>(null);
  const [injuryData, setInjuryData] = useState<any[]>([]);

  useEffect(() => {
    if (athleteId) loadData();
  }, [athleteId]);

  async function loadData() {
    setIsLoading(true);
    const [wellness, training, injuries] = await Promise.all([
      getWellnessReportData(athleteId!),
      getTrainingEntries(athleteId!),
      getInjuries(athleteId!),
    ]);
    setWellnessData(wellness.entries);
    setTrainingData(training);
    setInjuryData(injuries);

    const risk = await calculateInjuryRisk(athleteId!);
    setRiskData(risk);
    setIsLoading(false);
  }

  async function handleGenerate(type: string, format: "pdf" | "excel") {
    setGenerating(`${type}-${format}`);

    await new Promise((r) => setTimeout(r, 100));

    try {
      switch (type) {
        case "wellness":
          if (format === "pdf") generateWellnessPdf(wellnessData as any[], athleteName);
          else generateWellnessExcel(wellnessData as any[], athleteName);
          break;
        case "training":
          if (format === "pdf") generateTrainingPdf(trainingData as any[], athleteName);
          else generateTrainingExcel(trainingData as any[], athleteName);
          break;
        case "risk":
          if (riskData) {
            if (format === "pdf") generateInjuryRiskPdf(riskData.overall_risk, riskData.risk_level, riskData.factors, athleteName);
            else generateInjuryRiskExcel(riskData, athleteName);
          }
          break;
        case "injury":
          if (format === "pdf") generateInjuryManagementPdf(injuryData as any[], athleteName);
          else generateInjuryManagementExcel(injuryData as any[], athleteName);
          break;
      }
    } catch (err) {
      console.error("Report generation failed:", err);
    }

    setGenerating(null);
  }

  if (!athleteId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Athlete Profile Required</h2>
          <p className="text-muted-foreground">
            You need an athlete profile to view this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator or refresh the page after setting up your profile.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          Download Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate professional PDF and Excel reports for wellness, training, injury risk, and injury management
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {reportTypes.map((rt) => {
          const Icon = rt.icon;
          const hasData = (
            (rt.key === "wellness" && wellnessData.length > 0) ||
            (rt.key === "training" && trainingData.length > 0) ||
            (rt.key === "risk" && riskData !== null) ||
            (rt.key === "injury" && injuryData.length > 0)
          );

          return (
            <div key={rt.key} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${rt.bg}`}>
                  <Icon className={`h-6 w-6 ${rt.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{rt.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{rt.desc}</p>

                  {!hasData ? (
                    <p className="text-xs text-amber-600 mt-2">No data available for this report.</p>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleGenerate(rt.key, "pdf")}
                        disabled={generating === `${rt.key}-pdf`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {generating === `${rt.key}-pdf` ? "Generating..." : "PDF"}
                      </button>
                      <button
                        onClick={() => handleGenerate(rt.key, "excel")}
                        disabled={generating === `${rt.key}-excel`}
                        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                        {generating === `${rt.key}-excel` ? "Generating..." : "Excel"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-2">About the Reports</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p><strong className="text-foreground">PDF Reports</strong> &mdash; Professional formatted documents with summary statistics, data tables, and factor breakdowns. Suitable for clinical documentation and sharing with medical staff.</p>
          <p><strong className="text-foreground">Excel Reports</strong> &mdash; Raw data export with separate Summary and Data sheets. Suitable for further analysis, charting, and integration with external systems.</p>
        </div>
      </div>
    </div>
  );
}
