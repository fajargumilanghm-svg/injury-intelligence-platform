"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getTeamOverview, getTeamAthletes, getTeamWellness, getTeamAcwr,
  getAllInjuries, getTeamRiskHeatmap,
} from "@/lib/supabase/team-intelligence";
import type { Athlete, InjuryRecord } from "@/types";
import type { TeamOverview, AthleteWellnessSummary, AthleteAcwrSummary, WeeklyRiskPoint } from "@/lib/supabase/team-intelligence";
import { TeamRiskHeatmap } from "@/components/team-intelligence/team-risk-heatmap";
import { TeamAvailabilityChart } from "@/components/team-intelligence/team-availability-chart";
import { BodyMap } from "@/components/team-intelligence/body-map";
import { Loader2, Users, Activity, Shield, Heart, Gauge, TrendingUp, MapIcon, BarChart3 } from "lucide-react";

export function TeamDashboard() {
  const [overview, setOverview] = useState<TeamOverview | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [injuries, setInjuries] = useState<InjuryRecord[]>([]);
  const [wellnessData, setWellnessData] = useState<AthleteWellnessSummary[]>([]);
  const [acwrData, setAcwrData] = useState<AthleteAcwrSummary[]>([]);
  const [heatmapData, setHeatmapData] = useState<WeeklyRiskPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const [ov, ath, inj, w, a, hm] = await Promise.all([
      getTeamOverview(),
      getTeamAthletes(),
      getAllInjuries(),
      getTeamWellness(),
      getTeamAcwr(),
      getTeamRiskHeatmap(),
    ]);
    setOverview(ov);
    setAthletes(ath);
    setInjuries(inj);
    setWellnessData(w);
    setAcwrData(a);
    setHeatmapData(hm);
    setIsLoading(false);
  }

  const activeInjuries = useMemo(() =>
    injuries.filter((i) => i.status === "active" || i.status === "recovering"),
    [injuries]
  );

  const wellnessAvg = useMemo(() => {
    if (wellnessData.length === 0) return null;
    const valid = wellnessData.filter((w) => w.entry_count > 0);
    if (valid.length === 0) return null;
    return Math.round((valid.reduce((s, w) => s + w.avg_wellness, 0) / valid.length) * 10) / 10;
  }, [wellnessData]);

  const acwrAvg = useMemo(() => {
    if (acwrData.length === 0) return null;
    return Math.round((acwrData.reduce((s, a) => s + a.acwr, 0) / acwrData.length) * 100) / 100;
  }, [acwrData]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const highRiskAcwr = acwrData.filter((a) => a.risk_zone === "very_high" || a.risk_zone === "high").length;
  const highRiskWellness = wellnessData.filter((w) => w.avg_wellness > 0 && w.avg_wellness < 50).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Athletes</p>
              <p className="text-2xl font-bold">{overview?.totalAthletes ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Activity className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Injuries</p>
              <p className="text-2xl font-bold">{overview?.activeInjuries ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">High Risk</p>
              <p className="text-2xl font-bold">{overview?.highRiskCount ?? 0}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {highRiskAcwr > 0 && `${highRiskAcwr} by ACWR`}
            {highRiskAcwr > 0 && highRiskWellness > 0 && " · "}
            {highRiskWellness > 0 && `${highRiskWellness} by wellness`}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Heart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Wellness</p>
              <p className="text-2xl font-bold">{wellnessAvg ?? "—"}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {wellnessData.filter((w) => w.entry_count > 0).length} athletes reporting
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Gauge className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg ACWR</p>
              <p className="text-2xl font-bold">{acwrAvg ?? "—"}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {acwrData.filter((a) => a.risk_zone === "optimal").length} in optimal zone
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-primary" /> Team Risk Heatmap
          </h3>
          <TeamRiskHeatmap data={heatmapData} />
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Injury Body Map
          </h3>
          <BodyMap injuries={injuries} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Team Availability (14 weeks)
          </h3>
          <TeamAvailabilityChart injuries={injuries} totalAthletes={overview?.totalAthletes ?? 0} />
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> ACWR Overview
          </h3>
          {acwrData.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                <div className="h-2.5 w-2.5 rounded bg-green-400" /> Low (&lt;0.8)
                <div className="h-2.5 w-2.5 rounded bg-green-600 ml-2" /> Optimal (0.8–1.3)
                <div className="h-2.5 w-2.5 rounded bg-amber-500 ml-2" /> High (1.3–1.5)
                <div className="h-2.5 w-2.5 rounded bg-red-500 ml-2" /> Very High (&gt;1.5)
              </div>
              {acwrData.map((a) => (
                <div key={a.athlete_id} className="flex items-center gap-2">
                  <span className="text-xs w-28 truncate">{a.athlete_name}</span>
                  <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((a.acwr / 2.5) * 100, 100)}%`,
                        backgroundColor:
                          a.risk_zone === "very_high" ? "#ef4444" :
                          a.risk_zone === "high" ? "#f59e0b" :
                          a.risk_zone === "low" ? "#4ade80" : "#22c55e",
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums w-10 text-right">{a.acwr.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No ACWR data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
