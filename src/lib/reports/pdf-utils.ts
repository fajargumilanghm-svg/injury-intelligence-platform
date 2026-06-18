import jsPDF from "jspdf";
import "jspdf-autotable";
import type { WellnessEntry, TrainingEntry, InjuryRecord } from "@/types";

function addHeader(doc: jsPDF, title: string, subtitle: string): void {
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 14, 28);
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 14, 34);
  doc.line(14, 37, 196, 37);
}

function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Injury Intelligence Platform — Page ${i} of ${pageCount}`, 14, 288);
  }
}

// ─── Wellness PDF ──────────────────────────────────────────

export function generateWellnessPdf(entries: WellnessEntry[], athleteName: string): void {
  const doc = new jsPDF();
  addHeader(doc, "Wellness Report", `Athlete: ${athleteName} — ${entries.length} entries`);

  const avg = (key: keyof WellnessEntry) => {
    const vals = entries.map((e) => e[key] as number).filter((v) => v !== null);
    return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  };

  doc.setFontSize(11);
  doc.text("Summary Statistics", 14, 46);
  const summaryData = [
    ["Avg Wellness", avg("wellness_score")],
    ["Avg Sleep", avg("sleep_quality") + "/10"],
    ["Avg Fatigue", avg("fatigue") + "/10"],
    ["Avg Soreness", avg("muscle_soreness") + "/10"],
    ["Avg Stress", avg("stress_level") + "/10"],
    ["Avg Mood", avg("mood_state") + "/10"],
    ["Avg Recovery", avg("recovery_feeling") + "/10"],
  ];
  (doc as any).autoTable({
    startY: 50,
    head: [["Metric", "Average"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94] },
  });

  doc.setFontSize(11);
  const tableY = (doc as any).lastAutoTable.finalY + 12;
  doc.text("Detailed Entries", 14, tableY - 4);

  const headers = [["Date", "Wellness", "Sleep", "Fatigue", "Soreness", "Stress", "Mood", "Recovery"]];
  const rows = entries.slice(0, 50).map((e) => [
    e.submitted_at?.split("T")[0] ?? "",
    String(e.wellness_score ?? ""),
    String(e.sleep_quality ?? ""),
    String(e.fatigue ?? ""),
    String(e.muscle_soreness ?? ""),
    String(e.stress_level ?? ""),
    String(e.mood_state ?? ""),
    String(e.recovery_feeling ?? ""),
  ]);

  (doc as any).autoTable({
    startY: tableY,
    head: headers,
    body: rows,
    theme: "striped",
    styles: { fontSize: 7 },
  });

  addFooter(doc);
  doc.save(`wellness-report-${athleteName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ─── Training Load PDF ─────────────────────────────────────

export function generateTrainingPdf(entries: TrainingEntry[], athleteName: string): void {
  const doc = new jsPDF();
  addHeader(doc, "Training Load Report", `Athlete: ${athleteName} — ${entries.length} sessions`);

  const totalLoad = entries.reduce((s, t) => s + t.load_score, 0);
  const avgLoad = entries.length > 0 ? (totalLoad / entries.length).toFixed(0) : "—";
  const avgIntensity = entries.length > 0 ? (entries.reduce((s, t) => s + t.intensity_rpe, 0) / entries.length).toFixed(1) : "—";
  const avgDuration = entries.length > 0 ? Math.round(entries.reduce((s, t) => s + t.duration_minutes, 0) / entries.length) : 0;

  doc.setFontSize(11);
  doc.text("Summary Statistics", 14, 46);
  (doc as any).autoTable({
    startY: 50,
    head: [["Metric", "Value"]],
    body: [
      ["Total Sessions", String(entries.length)],
      ["Total Load", String(totalLoad)],
      ["Avg Load/Session", avgLoad],
      ["Avg Intensity (RPE)", avgIntensity],
      ["Avg Duration (min)", String(avgDuration)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  const tableY = (doc as any).lastAutoTable.finalY + 12;
  doc.text("Session Details", 14, tableY - 4);

  (doc as any).autoTable({
    startY: tableY,
    head: [["Date", "Type", "Duration (min)", "RPE", "Load (sRPE)"]],
    body: entries.slice(0, 50).map((t) => [
      t.training_date ?? "",
      t.training_type,
      String(t.duration_minutes),
      String(t.intensity_rpe),
      String(Math.round(t.load_score)),
    ]),
    theme: "striped",
    styles: { fontSize: 7 },
  });

  addFooter(doc);
  doc.save(`training-report-${athleteName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ─── Injury Risk PDF ───────────────────────────────────────

export function generateInjuryRiskPdf(
  riskScore: number,
  riskLevel: string,
  factors: { label: string; score: number; weight: number; contribution: number }[],
  athleteName: string
): void {
  const doc = new jsPDF();
  addHeader(doc, "Injury Risk Assessment", `Athlete: ${athleteName}`);

  doc.setFontSize(24);
  doc.text(`Risk Score: ${riskScore}/100`, 14, 50);
  doc.setFontSize(14);
  doc.setTextColor(riskLevel === "high" ? 220 : riskLevel === "moderate" ? 200 : 34);
  doc.text(`Classification: ${riskLevel.toUpperCase()} RISK`, 14, 60);
  doc.setTextColor(0);

  doc.setFontSize(11);
  doc.text("Risk Factor Breakdown", 14, 76);
  (doc as any).autoTable({
    startY: 80,
    head: [["Factor", "Score", "Weight", "Contribution"]],
    body: factors.map((f) => [
      f.label,
      `${f.score}/100`,
      `${Math.round(f.weight * 100)}%`,
      `+${f.contribution}`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [139, 92, 246] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 30, halign: "center" },
      3: { cellWidth: 30, halign: "center" },
    },
  });

  addFooter(doc);
  doc.save(`injury-risk-${athleteName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

// ─── Injury Management PDF ─────────────────────────────────

export function generateInjuryManagementPdf(injuries: InjuryRecord[], athleteName: string): void {
  const doc = new jsPDF();
  addHeader(doc, "Injury Management Report", `Athlete: ${athleteName} — ${injuries.length} injuries`);

  const activeCount = injuries.filter((i) => i.status === "active").length;
  const recoveredCount = injuries.filter((i) => i.status === "recovered").length;
  const chronicCount = injuries.filter((i) => i.status === "chronic").length;

  doc.setFontSize(11);
  doc.text("Summary", 14, 46);
  (doc as any).autoTable({
    startY: 50,
    head: [["Status", "Count"]],
    body: [
      ["Active", String(activeCount)],
      ["Recovering", String(injuries.filter((i) => i.status === "recovering").length)],
      ["Recovered", String(recoveredCount)],
      ["Chronic", String(chronicCount)],
      ["Total", String(injuries.length)],
    ],
    theme: "grid",
    headStyles: { fillColor: [239, 68, 68] },
  });

  const tableY = (doc as any).lastAutoTable.finalY + 12;
  doc.text("Injury Details", 14, tableY - 4);

  (doc as any).autoTable({
    startY: tableY,
    head: [["Date", "Type", "Location", "Severity", "Side", "Status", "Est. Days", "Actual Days"]],
    body: injuries.slice(0, 50).map((i) => [
      i.injury_date ?? "",
      i.injury_type,
      i.body_part,
      i.severity,
      i.side,
      i.status,
      i.estimated_recovery_days !== null ? String(i.estimated_recovery_days) : "—",
      i.actual_recovery_days !== null ? String(i.actual_recovery_days) : "—",
    ]),
    theme: "striped",
    styles: { fontSize: 7 },
  });

  if (injuries.filter((i) => i.treatment_notes).length > 0) {
    const notesY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(10);
    doc.text("Treatment Notes", 14, notesY);
    doc.setFontSize(8);
    let y = notesY + 6;
    injuries.filter((i) => i.treatment_notes).forEach((i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${i.injury_type} (${i.injury_date}): ${i.treatment_notes}`, 14, y);
      y += 5;
    });
  }

  addFooter(doc);
  doc.save(`injury-management-${athleteName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
