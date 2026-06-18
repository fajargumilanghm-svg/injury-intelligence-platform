"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LoadHeatmapProps {
  data: { date: string; load_score: number }[];
}

function getIntensity(load: number, maxLoad: number): string {
  if (maxLoad === 0) return "bg-muted";
  const ratio = load / maxLoad;
  if (ratio === 0) return "bg-muted";
  if (ratio < 0.25) return "bg-green-200";
  if (ratio < 0.5) return "bg-green-400";
  if (ratio < 0.75) return "bg-amber-400";
  return "bg-red-500";
}

function getLoadLabel(load: number, maxLoad: number): string {
  if (maxLoad === 0) return "No training";
  const ratio = load / maxLoad;
  if (ratio < 0.25) return "Very Light";
  if (ratio < 0.5) return "Light";
  if (ratio < 0.75) return "Moderate";
  return "Heavy";
}

export function LoadHeatmap({ data }: LoadHeatmapProps) {
  const { dayGrid, maxLoad, weekLabels, totalDays } = useMemo(() => {
    const loadMap = new Map<string, number>();
    for (const d of data) {
      loadMap.set(d.date, d.load_score);
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 83);

    const grid: { date: string; day: number; load: number; dateObj: Date }[] = [];

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const displayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      grid.push({
        date: displayStr,
        day: d.getDay(),
        load: loadMap.get(dateStr) ?? 0,
        dateObj: new Date(d),
      });
    }

    const max = Math.max(...grid.map((g) => g.load), 1);

    const weeks: string[] = [];
    for (let i = 0; i < grid.length; i += 7) {
      const d = grid[i]?.dateObj;
      if (d) {
        weeks.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      }
    }

    return { dayGrid: grid, maxLoad: max, weekLabels: weeks, totalDays: grid.length };
  }, [data]);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span>Less</span>
        <div className="h-3 w-3 rounded bg-muted" />
        <div className="h-3 w-3 rounded bg-green-200" />
        <div className="h-3 w-3 rounded bg-green-400" />
        <div className="h-3 w-3 rounded bg-amber-400" />
        <div className="h-3 w-3 rounded bg-red-500" />
        <span>More</span>
      </div>

      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pt-5">
          {dayNames.map((name) => (
            <div key={name} className="h-3 text-[10px] text-muted-foreground leading-3">{name}</div>
          ))}
        </div>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {Array.from({ length: Math.ceil(totalDays / 7) }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {dayNames.map((_, dayIdx) => {
                  const idx = weekIdx * 7 + dayIdx;
                  const cell = dayGrid[idx];
                  if (!cell) return <div key={dayIdx} className="h-3 w-3" />;
                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        "h-3 w-3 rounded-sm cursor-pointer transition-transform hover:scale-150",
                        getIntensity(cell.load, maxLoad)
                      )}
                      title={`${cell.date}: ${cell.load} load (${getLoadLabel(cell.load, maxLoad)})`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
