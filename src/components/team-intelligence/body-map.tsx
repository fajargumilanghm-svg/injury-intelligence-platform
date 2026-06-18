"use client";

import { useMemo } from "react";
import type { InjuryRecord } from "@/types";

interface BodyMapProps {
  injuries: InjuryRecord[];
}

interface BodyRegion {
  id: string;
  label: string;
  path: string;
  color: string;
  count: number;
}

const regionMap: Record<string, string> = {
  "Head": "head", "Neck": "neck",
  "Shoulder": "shoulder", "Upper Arm": "upper_arm", "Elbow": "elbow", "Forearm": "forearm", "Wrist": "wrist", "Hand": "hand",
  "Upper Back": "upper_back", "Mid Back": "mid_back", "Lower Back": "lower_back",
  "Pelvis": "pelvis", "Hip": "hip", "Groin": "groin",
  "Thigh": "thigh", "Knee": "knee", "Lower Leg": "lower_leg", "Ankle": "ankle", "Foot": "foot",
};

export function BodyMap({ injuries }: BodyMapProps) {
  const regions = useMemo(() => {
    const counts = new Map<string, number>();
    injuries.forEach((i) => {
      const region = regionMap[i.body_part] ?? "other";
      counts.set(region, (counts.get(region) ?? 0) + 1);
    });
    const maxCount = Math.max(1, ...counts.values());

    const defs: BodyRegion[] = [
      { id: "head", label: "Head", path: "M 170 15 C 170 5, 190 5, 190 15 L 190 30 C 190 35, 170 35, 170 30 Z", color: "#22c55e", count: 0 },
      { id: "neck", label: "Neck", path: "M 172 30 L 188 30 L 186 45 L 174 45 Z", color: "#22c55e", count: 0 },
      { id: "shoulder", label: "Shoulder", path: "M 140 45 L 172 45 L 170 60 L 145 60 Z", color: "#22c55e", count: 0 },
      { id: "upper_arm", label: "Upper Arm", path: "M 145 60 L 148 100 L 138 100 L 140 60 Z", color: "#22c55e", count: 0 },
      { id: "elbow", label: "Elbow", path: "M 138 97 L 148 97 L 148 105 L 138 105 Z", color: "#22c55e", count: 0 },
      { id: "forearm", label: "Forearm", path: "M 138 105 L 145 155 L 135 155 L 133 105 Z", color: "#22c55e", count: 0 },
      { id: "wrist", label: "Wrist", path: "M 133 152 L 145 152 L 146 160 L 132 160 Z", color: "#22c55e", count: 0 },
      { id: "hand", label: "Hand", path: "M 132 160 L 146 160 L 144 175 L 134 175 Z", color: "#22c55e", count: 0 },
      { id: "chest", label: "Chest", path: "M 172 45 L 210 45 L 210 85 L 172 80 Z", color: "#22c55e", count: 0 },
      { id: "abdomen", label: "Abdomen", path: "M 172 80 L 210 85 L 208 120 L 174 120 Z", color: "#22c55e", count: 0 },
      { id: "pelvis", label: "Pelvis", path: "M 172 120 L 208 120 L 205 135 L 175 135 Z", color: "#22c55e", count: 0 },
      { id: "hip", label: "Hip", path: "M 172 130 L 178 130 L 178 145 L 170 145 Z", color: "#22c55e", count: 0 },
      { id: "groin", label: "Groin", path: "M 180 130 L 200 130 L 198 140 L 182 140 Z", color: "#22c55e", count: 0 },
      { id: "thigh", label: "Thigh", path: "M 170 145 L 178 145 L 178 200 L 166 200 Z", color: "#22c55e", count: 0 },
      { id: "knee", label: "Knee", path: "M 166 197 L 178 197 L 178 210 L 165 210 Z", color: "#22c55e", count: 0 },
      { id: "lower_leg", label: "Lower Leg", path: "M 165 210 L 178 210 L 176 255 L 163 255 Z", color: "#22c55e", count: 0 },
      { id: "ankle", label: "Ankle", path: "M 163 252 L 176 252 L 177 262 L 162 262 Z", color: "#22c55e", count: 0 },
      { id: "foot", label: "Foot", path: "M 162 262 L 177 262 L 175 275 L 160 275 Z", color: "#22c55e", count: 0 },
    ];

    return defs.map((r) => {
      const c = counts.get(r.id) ?? 0;
      const intensity = maxCount > 0 ? c / maxCount : 0;
      let color = "#22c55e";
      if (c > 0) {
        if (intensity >= 0.7) color = "#ef4444";
        else if (intensity >= 0.4) color = "#f59e0b";
        else color = "#f97316";
      }
      return { ...r, count: c, color };
    });
  }, [injuries]);

  const totalInjuries = injuries.length;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="130 0 90 285" className="w-40 h-72" xmlns="http://www.w3.org/2000/svg">
        {regions.map((r) => (
          <g key={r.id}>
            <path
              d={r.path}
              fill={r.color}
              fillOpacity={r.count > 0 ? 0.7 : 0.08}
              stroke={r.count > 0 ? r.color : "#d1d5db"}
              strokeWidth={r.count > 0 ? 1.5 : 0.8}
              className="transition-all cursor-pointer hover:opacity-80"
            />
          </g>
        ))}
      </svg>

      <div className="mt-3 space-y-1">
        {regions.filter((r) => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 6).map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: r.color }} />
            <span className="capitalize">{r.label}</span>
            <span className="text-muted-foreground tabular-nums">({r.count})</span>
          </div>
        ))}
      </div>

      {totalInjuries > 0 && (
        <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Low</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-orange-500" /> Moderate</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded-sm bg-red-500" /> High</span>
        </div>
      )}
    </div>
  );
}
