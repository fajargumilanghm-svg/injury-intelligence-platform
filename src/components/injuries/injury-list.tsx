"use client";

import { useState } from "react";
import { updateInjury, deleteInjury } from "@/lib/supabase/injuries";
import type { InjuryRecord, InjuryStatus } from "@/types";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { InjuryForm } from "@/components/injuries/injury-form";
import { RecoveryTimeline } from "@/components/injuries/recovery-timeline";
import { RtpTracker } from "@/components/injuries/rtp-tracker";
import {
  Trash2, ChevronDown, ChevronRight, Activity, AlertTriangle, CheckCircle2, Clock,
  RotateCcw, Pencil, CalendarDays, Timer, Target, FileText,
} from "lucide-react";

interface InjuryListProps {
  athleteId: string;
  injuries: InjuryRecord[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<InjuryRecord>) => void;
}

const statusMeta: Record<InjuryStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: "Active", color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle },
  recovering: { label: "Recovering", color: "bg-amber-100 text-amber-700 border-amber-200", icon: RotateCcw },
  recovered: { label: "Recovered", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  chronic: { label: "Chronic", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Clock },
};

const severityOrder: Record<string, number> = { minor: 1, moderate: 2, severe: 3 };

type ActiveTab = "details" | "milestones" | "rtp";

export function InjuryList({ athleteId, injuries, onDelete, onUpdate }: InjuryListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("details");

  async function handleStatusChange(id: string, status: InjuryStatus) {
    const result = await updateInjury(id, { status });
    if (result) onUpdate(id, result);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this injury record permanently?")) return;
    await deleteInjury(id);
    onDelete(id);
  }

  const sorted = [...injuries].sort((a, b) => {
    const sevDiff = (severityOrder[b.severity] ?? 0) - (severityOrder[a.severity] ?? 0);
    if (sevDiff !== 0) return sevDiff;
    return b.injury_date.localeCompare(a.injury_date);
  });

  if (injuries.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No injuries recorded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((injury) => {
        const StatusIcon = statusMeta[injury.status].icon;
        const isOpen = expanded === injury.id;
        const isEditing = editingId === injury.id;

        const daysSince = differenceInCalendarDays(new Date(), parseISO(injury.injury_date));
        const estDaysLeft = injury.expected_return_date
          ? differenceInCalendarDays(parseISO(injury.expected_return_date), new Date())
          : null;

        return (
          <div key={injury.id} className="rounded-lg border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setExpanded(isOpen ? null : injury.id);
                setEditingId(null);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta[injury.status].color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusMeta[injury.status].label}
              </div>
              <span className="font-medium text-sm">{injury.injury_type}</span>
              <span className="text-xs text-muted-foreground">{injury.body_part}</span>
              {injury.side !== "n/a" && <span className="text-[10px] text-muted-foreground uppercase">({injury.side})</span>}
              <span className={`ml-auto text-xs font-medium tabular-nums ${
                injury.severity === "severe" ? "text-red-600" : injury.severity === "moderate" ? "text-amber-600" : "text-muted-foreground"
              }`}>
                {injury.severity}
              </span>
              <span className="text-xs text-muted-foreground">{format(new Date(injury.injury_date), "MMM d, yyyy")}</span>
            </button>

            {isOpen && (
              <div className="border-t">
                {/* Tab bar */}
                <div className="flex border-b bg-muted/20">
                  {([
                    { key: "details" as ActiveTab, label: "Details & Status", icon: FileText },
                    { key: "milestones" as ActiveTab, label: "Recovery Timeline", icon: Clock },
                    { key: "rtp" as ActiveTab, label: "Return to Play", icon: Target },
                  ]).map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => { setActiveTab(tab.key); setEditingId(null); }}
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                          activeTab === tab.key
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <TabIcon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "details" && (
                  <div className="px-4 py-3 space-y-3">
                    {isEditing ? (
                      <div>
                        <InjuryForm
                          athleteId={athleteId}
                          injury={injury}
                          onSaved={() => setEditingId(null)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="mt-2">
                          Cancel Editing
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          {injury.diagnosis && <p className="text-sm"><span className="text-muted-foreground">Diagnosis:</span> {injury.diagnosis}</p>}
                          <Button variant="outline" size="sm" onClick={() => setEditingId(injury.id)} className="h-7 text-xs">
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Days Since</span>
                            <p className="font-medium tabular-nums">{daysSince} days</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> Est. Recovery</span>
                            <p className="font-medium">{injury.estimated_recovery_days ? `${injury.estimated_recovery_days} days` : "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Expected Return</span>
                            <p className="font-medium">{injury.expected_return_date ? format(new Date(injury.expected_return_date), "MMM d, yyyy") : "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Actual Return</span>
                            <p className="font-medium">{injury.actual_return_date ? format(new Date(injury.actual_return_date), "MMM d, yyyy") : "—"}</p>
                          </div>
                        </div>

                        {estDaysLeft !== null && estDaysLeft > 0 && injury.status !== "recovered" && (
                          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                            Est. {estDaysLeft} day{estDaysLeft !== 1 ? "s" : ""} until expected return
                          </div>
                        )}

                        {injury.return_to_play_date && (
                          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700 flex items-center gap-2">
                            <Target className="h-3.5 w-3.5" />
                            Return to Play: {format(new Date(injury.return_to_play_date), "MMMM d, yyyy")}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Mechanism</span>
                            <p className="font-medium capitalize">{injury.mechanism?.replace(/_/g, " ") || "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Actual Recovery</span>
                            <p className="font-medium">{injury.actual_recovery_days ? `${injury.actual_recovery_days} days` : "—"}</p>
                          </div>
                        </div>

                        {injury.treatment_notes && (
                          <p className="text-xs text-muted-foreground"><span className="text-foreground">Treatment:</span> {injury.treatment_notes}</p>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                          <span className="text-xs text-muted-foreground">Status:</span>
                          {(["active", "recovering", "recovered", "chronic"] as InjuryStatus[]).map((s) => {
                            if (s === injury.status) return null;
                            const Icon = statusMeta[s].icon;
                            return (
                              <Button
                                key={s}
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(injury.id, s)}
                                className="h-7 text-[11px] px-2"
                              >
                                <Icon className="h-3 w-3 mr-1" />{statusMeta[s].label}
                              </Button>
                            );
                          })}
                          <div className="ml-auto">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(injury.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "milestones" && (
                  <div className="px-4 py-3">
                    <RecoveryTimeline injuryId={injury.id} />
                  </div>
                )}

                {activeTab === "rtp" && (
                  <div className="px-4 py-3">
                    <RtpTracker injuryId={injury.id} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
