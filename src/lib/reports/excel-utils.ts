import * as XLSX from "xlsx";
import type { WellnessEntry, TrainingEntry, InjuryRecord } from "@/types";
import type { InjuryRiskResult } from "@/lib/supabase/injury-risk";

function createDownload(buffer: Uint8Array, filename: string): void {
  const blob = new Blob([buffer as unknown as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function writeWorkbook(wb: XLSX.WorkBook): Uint8Array {
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

// ─── Wellness Excel ────────────────────────────────────────

export function generateWellnessExcel(entries: WellnessEntry[], athleteName: string): void {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Metric", "Value"],
    ["Athlete", athleteName],
    ["Total Entries", entries.length],
    ["Generated", new Date().toLocaleDateString()],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  const headers = ["Date", "Wellness Score", "Sleep Quality", "Fatigue", "Muscle Soreness", "Stress Level", "Mood State", "Recovery Feeling"];
  const rows = entries.map((e) => [
    e.submitted_at?.split("T")[0] ?? "",
    e.wellness_score,
    e.sleep_quality,
    e.fatigue,
    e.muscle_soreness,
    e.stress_level,
    e.mood_state,
    e.recovery_feeling,
  ]);
  const dataWs = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, dataWs, "Wellness Data");

  const buffer = writeWorkbook(wb);
  createDownload(buffer, `wellness-report-${athleteName.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
}

// ─── Training Load Excel ───────────────────────────────────

export function generateTrainingExcel(entries: TrainingEntry[], athleteName: string): void {
  const wb = XLSX.utils.book_new();

  const totalLoad = entries.reduce((s, t) => s + t.load_score, 0);
  const avgLoad = entries.length > 0 ? totalLoad / entries.length : 0;

  const summaryData = [
    ["Metric", "Value"],
    ["Athlete", athleteName],
    ["Total Sessions", entries.length],
    ["Total Load", Math.round(totalLoad)],
    ["Avg Load/Session", Math.round(avgLoad)],
    ["Generated", new Date().toLocaleDateString()],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  const headers = ["Date", "Training Type", "Duration (min)", "Intensity (RPE)", "Load (sRPE)", "Notes"];
  const rows = entries.map((e) => [
    e.training_date,
    e.training_type,
    e.duration_minutes,
    e.intensity_rpe,
    Math.round(e.load_score),
    e.notes ?? "",
  ]);
  const dataWs = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, dataWs, "Training Data");

  const buffer = writeWorkbook(wb);
  createDownload(buffer, `training-report-${athleteName.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
}

// ─── Injury Risk Excel ─────────────────────────────────────

export function generateInjuryRiskExcel(result: InjuryRiskResult, athleteName: string): void {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Metric", "Value"],
    ["Athlete", athleteName],
    ["Overall Risk Score", result.overall_risk],
    ["Risk Level", result.risk_level.toUpperCase()],
    ["Generated", new Date().toLocaleDateString()],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  const headers = ["Factor", "Score (0-100)", "Weight", "Contribution", "Detail"];
  const rows = result.factors.map((f) => [
    f.label,
    f.score,
    `${Math.round(f.weight * 100)}%`,
    `+${f.contribution}`,
    f.detail,
  ]);
  const factorsWs = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, factorsWs, "Risk Factors");

  const buffer = writeWorkbook(wb);
  createDownload(buffer, `injury-risk-${athleteName.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
}

// ─── Injury Management Excel ───────────────────────────────

export function generateInjuryManagementExcel(injuries: InjuryRecord[], athleteName: string): void {
  const wb = XLSX.utils.book_new();

  const active = injuries.filter((i) => i.status === "active").length;
  const recovered = injuries.filter((i) => i.status === "recovered").length;

  const summaryData = [
    ["Metric", "Value"],
    ["Athlete", athleteName],
    ["Total Injuries", injuries.length],
    ["Active", active],
    ["Recovered", recovered],
    ["Recovering", injuries.filter((i) => i.status === "recovering").length],
    ["Chronic", injuries.filter((i) => i.status === "chronic").length],
    ["Generated", new Date().toLocaleDateString()],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  const headers = ["Date", "Type", "Location", "Severity", "Mechanism", "Side", "Status", "Est. Days", "Actual Days", "Diagnosis", "Treatment Notes"];
  const rows = injuries.map((i) => [
    i.injury_date,
    i.injury_type,
    i.body_part,
    i.severity,
    i.mechanism ?? "",
    i.side,
    i.status,
    i.estimated_recovery_days ?? "",
    i.actual_recovery_days ?? "",
    i.diagnosis ?? "",
    i.treatment_notes ?? "",
  ]);
  const dataWs = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, dataWs, "All Injuries");

  const buffer = writeWorkbook(wb);
  createDownload(buffer, `injury-management-${athleteName.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
}
