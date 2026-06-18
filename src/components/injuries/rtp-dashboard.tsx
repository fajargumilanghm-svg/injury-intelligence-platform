"use client";

import { useState, useEffect, useMemo } from "react";
import { getInjuries, getMilestones, getRtpPhases } from "@/lib/supabase/injuries";
import type { InjuryRecord, RecoveryMilestone, RtpPhase } from "@/types";
import { format } from "date-fns";
import { Loader2, Target, CheckCircle2, Clock, Activity, TrendingUp, CalendarDays } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface RtpDashboardProps {
  athleteId: string;
}

const statusOrder = ["active", "recovering", "recovered", "chronic"];

export function RtpDashboard({ athleteId }: RtpDashboardProps) {
  const [injuries, setInjuries] = useState<InjuryRecord[]>([]);
  const [milestones, setMilestones] = useState<Record<string, RecoveryMilestone[]>>({});
  const [rtpPhases, setRtpPhases] = useState<Record<string, RtpPhase[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [athleteId]);

  async function loadData() {
    const inj = await getInjuries(athleteId);
    setInjuries(inj);

    const mileMap: Record<string, RecoveryMilestone[]> = {};
    const rtpMap: Record<string, RtpPhase[]> = {};
    await Promise.all(
      inj.map(async (i) => {
        const [m, r] = await Promise.all([getMilestones(i.id), getRtpPhases(i.id)]);
        mileMap[i.id] = m;
        rtpMap[i.id] = r;
      })
    );
    setMilestones(mileMap);
    setRtpPhases(rtpMap);
    setIsLoading(false);
  }

  const stats = useMemo(() => {
    const total = injuries.length;
    const active = injuries.filter((i) => i.status === "active").length;
    const recovering = injuries.filter((i) => i.status === "recovering").length;
    const recovered = injuries.filter((i) => i.status === "recovered").length;
    const chronic = injuries.filter((i) => i.status === "chronic").length;

    const totalPhases = Object.values(rtpPhases).flat();
    const completedPhases = totalPhases.filter((p) => p.status === "completed").length;
    const totalMilestones = Object.values(milestones).flat();
    const completedMilestones = totalMilestones.filter((m) => m.completed).length;

    return {
      total, active, recovering, recovered, chronic,
      totalPhases: totalPhases.length,
      completedPhases,
      totalMilestones: totalMilestones.length,
      completedMilestones,
      rtpProgress: totalPhases.length > 0 ? Math.round((completedPhases / totalPhases.length) * 100) : 0,
      milestoneProgress: totalMilestones.length > 0 ? Math.round((completedMilestones / totalMilestones.length) * 100) : 0,
    };
  }, [injuries, milestones, rtpPhases]);

  const timelineData = useMemo(() => {
    const points: { date: string; injuries: number; recovered: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const iso = d.toISOString().split("T")[0];
      const activeOnDate = injuries.filter((inj) => inj.injury_date <= iso &&
        (inj.actual_return_date === null || inj.actual_return_date >= iso) &&
        inj.status !== "recovered");
      const recoveredOnDate = injuries.filter((inj) =>
        inj.actual_return_date !== null && inj.actual_return_date <= iso);
      points.push({ date: dateStr, injuries: activeOnDate.length, recovered: recoveredOnDate.length });
    }
    return points;
  }, [injuries]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (injuries.length === 0) {
    return (
      <div className="text-center py-16">
        <Target className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Injury Data</h3>
        <p className="text-sm text-muted-foreground">Record injuries to see return-to-play progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Injuries</p>
          <p className="text-3xl font-bold mt-1">{stats.total}</p>
          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
            <span className="text-red-600">{stats.active} active</span>
            <span className="text-amber-600">{stats.recovering} recovering</span>
            <span className="text-green-600">{stats.recovered} recovered</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Recovery Progress</p>
          <p className="text-3xl font-bold mt-1">{stats.milestoneProgress}%</p>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${stats.milestoneProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stats.completedMilestones}/{stats.totalMilestones} milestones</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">RTP Progression</p>
          <p className="text-3xl font-bold mt-1">{stats.rtpProgress}%</p>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${stats.rtpProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stats.completedPhases}/{stats.totalPhases} phases</p>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Clearance Status</p>
          <p className="text-3xl font-bold mt-1">{stats.recovered}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.recovered === stats.total ? "All injuries cleared" :
             `${stats.total - stats.recovered} pending clearance`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Rehabilitation Timeline (30 days)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval={4} />
                <YAxis tick={{ fontSize: 9 }} className="text-muted-foreground" allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="injuries" stroke="#ef4444" fill="url(#activeGrad)" strokeWidth={2} name="Active Injuries" />
                <Area type="monotone" dataKey="recovered" stroke="#22c55e" fill="url(#recoveredGrad)" strokeWidth={2} name="Recovered" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Active Recoveries
          </h3>
          <div className="space-y-3 max-h-56 overflow-y-auto">
            {injuries.filter((i) => i.status !== "recovered").length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All injuries recovered</p>
            ) : (
              injuries.filter((i) => i.status !== "recovered").map((i) => {
                const rtp = rtpPhases[i.id] ?? [];
                const currentPhase = rtp.find((p) => p.status === "in_progress");
                const completedCount = rtp.filter((p) => p.status === "completed").length;
                return (
                  <div key={i.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      i.severity === "severe" ? "bg-red-100" : i.severity === "moderate" ? "bg-amber-100" : "bg-blue-100"
                    }`}>
                      <Clock className={`h-4 w-4 ${
                        i.severity === "severe" ? "text-red-600" : i.severity === "moderate" ? "text-amber-600" : "text-blue-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{i.injury_type}</p>
                      <p className="text-xs text-muted-foreground">{i.body_part} &middot; {format(new Date(i.injury_date), "MMM d")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium capitalize">{i.status}</p>
                      {currentPhase && <p className="text-[10px] text-muted-foreground">Phase {currentPhase.phase_number}/7</p>}
                      {rtp.length > 0 && (
                        <div className="mt-1 h-1.5 w-16 rounded-full bg-muted ml-auto">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${(completedCount / rtp.length) * 100}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {injuries.filter((i) => i.return_to_play_date !== null).length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Clearance Status
          </h3>
          <div className="space-y-2">
            {injuries.filter((i) => i.return_to_play_date !== null).map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">{i.injury_type}</p>
                  <p className="text-xs text-green-600">{i.body_part} &middot; Cleared for play</p>
                </div>
                <p className="text-xs text-green-700 font-medium">
                  RTP: {format(new Date(i.return_to_play_date!), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
