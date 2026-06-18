"use client";

import { useState, useEffect } from "react";
import { getRtpPhases, upsertRtpPhase, initializeRtpPhases } from "@/lib/supabase/injuries";
import type { RtpPhase, RtpPhaseStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, CheckCircle2, Circle, RotateCcw, Lock } from "lucide-react";

interface RtpTrackerProps {
  injuryId: string;
}

const statusMeta: Record<RtpPhaseStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: "Pending", icon: Circle, color: "text-muted-foreground" },
  in_progress: { label: "In Progress", icon: RotateCcw, color: "text-blue-600" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-600" },
};

export function RtpTracker({ injuryId }: RtpTrackerProps) {
  const [phases, setPhases] = useState<RtpPhase[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPhases();
  }, [injuryId]);

  async function loadPhases() {
    let data = await getRtpPhases(injuryId);
    if (data.length === 0) {
      await initializeRtpPhases(injuryId);
      data = await getRtpPhases(injuryId);
      setInitialized(true);
    }
    setPhases(data);
    setIsLoading(false);
  }

  async function handleNextPhase() {
    const currentIdx = phases.findIndex((p) => p.status === "in_progress");
    const lastCompletedIdx = phases.map((p, i) => p.status === "completed" ? i : -1).filter((i) => i !== -1).pop() ?? -1;

    let nextIdx = -1;
    if (currentIdx >= 0) {
      nextIdx = currentIdx + 1;
    } else if (lastCompletedIdx >= 0) {
      nextIdx = lastCompletedIdx + 1;
    } else {
      nextIdx = 0;
    }

    if (nextIdx >= phases.length) return;

    const updated = [...phases];

    if (currentIdx >= 0) {
      const prevPhase = updated[currentIdx];
      const updatedPrev = await upsertRtpPhase(injuryId, {
        phase_number: prevPhase.phase_number,
        phase_name: prevPhase.phase_name,
        description: prevPhase.description,
        start_date: prevPhase.start_date,
        completion_date: new Date().toISOString().split("T")[0],
        status: "completed",
      });
      if (updatedPrev) updated[currentIdx] = updatedPrev;
    }

    const nextPhase = updated[nextIdx];
    const updatedNext = await upsertRtpPhase(injuryId, {
      phase_number: nextPhase.phase_number,
      phase_name: nextPhase.phase_name,
      description: nextPhase.description,
      start_date: nextPhase.start_date ?? new Date().toISOString().split("T")[0],
      completion_date: null,
      status: "in_progress",
    });
    if (updatedNext) updated[nextIdx] = updatedNext;

    setPhases(updated);
  }

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const currentPhase = phases.find((p) => p.status === "in_progress");
  const completedCount = phases.filter((p) => p.status === "completed").length;
  const allDone = completedCount === phases.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Return to Play — Phase {completedCount + 1} of {phases.length}</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{Math.round((completedCount / phases.length) * 100)}%</span>
          {!allDone && (
            <Button variant="outline" size="sm" onClick={handleNextPhase} className="h-7 text-xs">
              {currentPhase ? "Complete & Advance" : "Start Phase"}
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${(completedCount / phases.length) * 100}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {phases.map((p) => {
          const meta = statusMeta[p.status];
          const Icon = meta.icon;
          const isCurrent = p.status === "in_progress";
          return (
            <div
              key={p.phase_number}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-xs transition-colors ${
                isCurrent ? "border-blue-300 bg-blue-50" : ""
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isCurrent ? "text-blue-700" : ""}`}>
                    Phase {p.phase_number}: {p.phase_name}
                  </span>
                  <span className={`text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{p.description}</p>
              </div>
              <div className="text-[10px] text-muted-foreground text-right shrink-0">
                {p.start_date && <div>Start: {format(new Date(p.start_date), "MMM d")}</div>}
                {p.completion_date && <div>Done: {format(new Date(p.completion_date), "MMM d")}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-center">
          <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
          <p className="text-sm font-medium text-green-700">All RTP Phases Completed</p>
          <p className="text-xs text-green-600">Athlete is cleared for full competition.</p>
        </div>
      )}
    </div>
  );
}
