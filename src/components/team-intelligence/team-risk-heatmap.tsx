"use client";

import { useMemo } from "react";
import type { WeeklyRiskPoint } from "@/lib/supabase/team-intelligence";
import { Activity } from "lucide-react";

interface TeamRiskHeatmapProps {
  data: WeeklyRiskPoint[];
}

export function TeamRiskHeatmap({ data }: TeamRiskHeatmapProps) {
  const athleteWeeks = useMemo(() => {
    const athleteIds = [...new Set(data.map((d) => d.athlete_id))];
    const weeks = [...new Set(data.map((d) => d.week))].sort((a, b) => {
      const parse = (s: string) => {
        const [month, day] = s.split(" ");
        return new Date(`${month} ${day}, 2026`).getTime();
      };
      return parse(a) - parse(b);
    });

    const athleteNames = new Map(data.map((d) => [d.athlete_id, d.athlete_name]));

    return { athleteIds, weeks, athleteNames };
  }, [data]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "#ef4444";
      case "moderate": return "#f59e0b";
      case "low": return "#22c55e";
      default: return "#e5e7eb";
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">No risk data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Athlete</th>
            {athleteWeeks.weeks.map((w) => (
              <th key={w} className="px-1 py-1.5 text-center font-medium text-muted-foreground min-w-[28px]">{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {athleteWeeks.athleteIds.map((athleteId) => {
            const weekMap = new Map(data.filter((d) => d.athlete_id === athleteId).map((d) => [d.week, d]));
            const totalRisk = data.filter((d) => d.athlete_id === athleteId).reduce((s, d) => s + d.risk_score, 0);
            const avgRisk = totalRisk / athleteWeeks.weeks.length;
            return (
              <tr key={athleteId} className="border-b hover:bg-muted/30">
                <td className="px-2 py-1.5 text-left whitespace-nowrap font-medium">
                  {athleteWeeks.athleteNames.get(athleteId) ?? "—"}
                  <span className={`ml-1.5 text-[10px] ${
                    avgRisk >= 70 ? "text-red-600" : avgRisk >= 40 ? "text-amber-600" : "text-green-600"
                  }`}>
                    ({Math.round(avgRisk)})
                  </span>
                </td>
                {athleteWeeks.weeks.map((week) => {
                  const point = weekMap.get(week);
                  return (
                    <td key={week} className="px-1 py-1 text-center">
                      <div
                        className="mx-auto h-5 w-5 rounded-sm cursor-pointer transition-transform hover:scale-125"
                        style={{ backgroundColor: getRiskColor(point?.risk_level ?? "low") }}
                        title={`${athleteWeeks.athleteNames.get(athleteId)} — ${week}: ${point?.risk_level ?? "N/A"} (${point?.risk_score ?? "—"})`}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
        <span>Risk:</span>
        <span className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#22c55e" }} /> Low</span>
        <span className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#f59e0b" }} /> Moderate</span>
        <span className="flex items-center gap-1"><div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#ef4444" }} /> High</span>
      </div>
    </div>
  );
}
