"use client";

import { useState, useMemo } from "react";
import { deleteScreening } from "@/lib/supabase/physical-screening";
import type { PhysicalScreening } from "@/types";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight, Activity, Scale, Ruler, ArrowRightLeft, Zap } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface ScreeningHistoryProps {
  screenings: PhysicalScreening[];
  onDelete: (id: string) => void;
}

type HistorySection = {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
};

const sections: HistorySection[] = [
  { key: "fms", label: "FMS Trend", icon: Activity, color: "text-blue-600" },
  { key: "ybt", label: "Y Balance Trend", icon: Scale, color: "text-purple-600" },
  { key: "sitreach", label: "Sit and Reach Trend", icon: Ruler, color: "text-amber-600" },
  { key: "slh", label: "Single Leg Hop Trend", icon: ArrowRightLeft, color: "text-green-600" },
  { key: "cmj", label: "CMJ Trend", icon: Zap, color: "text-red-600" },
];

export function ScreeningHistory({ screenings, onDelete }: ScreeningHistoryProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...screenings];
    copy.sort((a, b) => {
      const cmp = a.screening_date.localeCompare(b.screening_date);
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [screenings, sortAsc]);

  const trendData = useMemo(() => {
    const reversed = [...screenings].sort((a, b) => a.screening_date.localeCompare(b.screening_date));
    return reversed.map((s) => ({
      date: format(new Date(s.screening_date), "MMM d"),
      fms_total: s.fms_total,
      ybt_left: s.ybt_composite_left,
      ybt_right: s.ybt_composite_right,
      sit_reach: s.sit_and_reach_cm,
      slh_left: s.slh_left_cm,
      slh_right: s.slh_right_cm,
      slh_ratio: s.slh_ratio,
      cmj_height: s.cmj_height_cm,
      cmj_power: s.cmj_peak_power_w,
    }));
  }, [screenings]);

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this screening session?")) return;
    await deleteScreening(id);
    onDelete(id);
  }

  const summaryFields: { key: keyof PhysicalScreening; label: string; unit: string }[] = [
    { key: "fms_total", label: "FMS", unit: "/21" },
    { key: "ybt_composite_left", label: "Y-Balance L", unit: "%" },
    { key: "ybt_composite_right", label: "Y-Balance R", unit: "%" },
    { key: "sit_and_reach_cm", label: "Sit & Reach", unit: "cm" },
    { key: "slh_left_cm", label: "Hop L", unit: "cm" },
    { key: "slh_right_cm", label: "Hop R", unit: "cm" },
    { key: "slh_ratio", label: "LSI", unit: "%" },
    { key: "cmj_height_cm", label: "CMJ", unit: "cm" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="px-3 py-2.5 text-left font-medium cursor-pointer select-none hover:text-foreground"
                  onClick={() => setSortAsc(!sortAsc)}
                >
                  Date {sortAsc ? "↑" : "↓"}
                </th>
                {summaryFields.map((f) => (
                  <th key={f.key} className="px-2 py-2.5 text-right font-medium">{f.label}</th>
                ))}
                <th className="px-2 py-2.5 text-right font-medium">Notes</th>
                <th className="px-2 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className="border-b hover:bg-muted/50">
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{format(new Date(s.screening_date), "MMM d, yyyy")}</td>
                  {summaryFields.map((f) => {
                    const val = s[f.key] as number | null;
                    return (
                      <td key={f.key} className="px-2 py-2 text-right tabular-nums font-medium">
                        {val !== null ? val : "—"}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-right text-muted-foreground max-w-[120px] truncate" title={s.notes ?? ""}>
                    {s.notes || "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((sec) => {
          const Icon = sec.icon;
          const isOpen = openSections[sec.key] ?? (sec.key === "fms");
          return (
            <div key={sec.key} className="rounded-lg border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(sec.key)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Icon className={`h-4 w-4 ${sec.color}`} />
                {sec.label}
              </button>

              {isOpen && (
                <div className="border-t px-4 pb-4 pt-3">
                  {sec.key === "fms" && (
                    <TrendChart
                      data={trendData}
                      lines={[{ key: "fms_total", color: "#2563eb", name: "FMS Total" }]}
                      yDomain={[0, 21]}
                      unit="/21"
                    />
                  )}
                  {sec.key === "ybt" && (
                    <TrendChart
                      data={trendData.filter((d) => d.ybt_left !== null || d.ybt_right !== null)}
                      lines={[
                        { key: "ybt_left", color: "#7c3aed", name: "Composite L" },
                        { key: "ybt_right", color: "#a78bfa", name: "Composite R" },
                      ]}
                      yDomain={[60, 120]}
                      unit="%"
                    />
                  )}
                  {sec.key === "sitreach" && (
                    <TrendChart
                      data={trendData.filter((d) => d.sit_reach !== null)}
                      lines={[{ key: "sit_reach", color: "#d97706", name: "Sit & Reach" }]}
                      yDomain={[0, 50]}
                      unit="cm"
                    />
                  )}
                  {sec.key === "slh" && (
                    <TrendChart
                      data={trendData.filter((d) => d.slh_left !== null || d.slh_right !== null)}
                      lines={[
                        { key: "slh_left", color: "#16a34a", name: "Left" },
                        { key: "slh_right", color: "#4ade80", name: "Right" },
                        { key: "slh_ratio", color: "#f59e0b", name: "LSI (%)" },
                      ]}
                      unit="cm"
                    />
                  )}
                  {sec.key === "cmj" && (
                    <TrendChart
                      data={trendData.filter((d) => d.cmj_height !== null)}
                      lines={[
                        { key: "cmj_height", color: "#dc2626", name: "Jump Height" },
                        { key: "cmj_power", color: "#f87171", name: "Peak Power (W)" },
                      ]}
                      unit="cm"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendChart({
  data,
  lines,
  yDomain,
  unit,
}: {
  data: Record<string, number | string | null>[];
  lines: { key: string; color: string; name: string }[];
  yDomain?: [number, number];
  unit?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data recorded yet.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
          <YAxis domain={yDomain ?? ["auto", "auto"]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value) =>
              typeof value === "number" ? [value.toFixed(1), ""] : [String(value ?? ""), ""]
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={line.name}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
