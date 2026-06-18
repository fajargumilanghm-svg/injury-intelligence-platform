"use client";

import { useMemo } from "react";
import type { InjuryRecord } from "@/types";
import { format, differenceInDays, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TeamAvailabilityChartProps {
  injuries: InjuryRecord[];
  totalAthletes: number;
}

export function TeamAvailabilityChart({ injuries, totalAthletes }: TeamAvailabilityChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const points: { date: string; available: number; injured: number; recovering: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      const endOfWeek = new Date(d);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const weekStart = d.toISOString().split("T")[0];
      const weekEnd = endOfWeek.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const active = injuries.filter((inj) => {
        const injDate = inj.injury_date;
        const returnDate = inj.actual_return_date ?? inj.return_to_play_date;
        return injDate <= weekEnd && (!returnDate || returnDate >= weekStart);
      });

      const injured = active.filter((i) => i.status === "active").length;
      const recovering = active.filter((i) => i.status === "recovering" || i.status === "chronic").length;
      const available = totalAthletes - injured - recovering;

      points.push({
        date: label,
        available: Math.max(0, available),
        injured,
        recovering,
      });
    }

    return points;
  }, [injuries, totalAthletes]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="available" stackId="a" fill="#22c55e" name="Available" radius={[0, 0, 0, 0]} />
          <Bar dataKey="recovering" stackId="a" fill="#f59e0b" name="Recovering" radius={[0, 0, 0, 0]} />
          <Bar dataKey="injured" stackId="a" fill="#ef4444" name="Injured" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
