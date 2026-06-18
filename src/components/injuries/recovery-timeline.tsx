"use client";

import { useState, useEffect } from "react";
import {
  getMilestones, createMilestone, updateMilestone, deleteMilestone,
} from "@/lib/supabase/injuries";
import type { RecoveryMilestone, MilestoneType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  CheckCircle2, Circle, Plus, Trash2, Stethoscope, Dumbbell, BrainCircuit,
  Zap, Activity, ShieldCheck, MoreHorizontal, Loader2,
} from "lucide-react";

interface RecoveryTimelineProps {
  injuryId: string;
}

const milestoneMeta: Record<MilestoneType, { label: string; icon: React.ElementType; color: string }> = {
  medical: { label: "Medical", icon: Stethoscope, color: "text-red-600" },
  rehab: { label: "Rehab", icon: Activity, color: "text-amber-600" },
  strength: { label: "Strength", icon: Dumbbell, color: "text-green-600" },
  proprioception: { label: "Proprioception", icon: BrainCircuit, color: "text-purple-600" },
  sport_specific: { label: "Sport-Specific", icon: Zap, color: "text-blue-600" },
  full_training: { label: "Full Training", icon: Activity, color: "text-indigo-600" },
  rtp_clearance: { label: "RTP Clearance", icon: ShieldCheck, color: "text-emerald-600" },
  other: { label: "Other", icon: MoreHorizontal, color: "text-muted-foreground" },
};

export function RecoveryTimeline({ injuryId }: RecoveryTimelineProps) {
  const [milestones, setMilestones] = useState<RecoveryMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newType, setNewType] = useState<MilestoneType>("rehab");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    loadMilestones();
  }, [injuryId]);

  async function loadMilestones() {
    const data = await getMilestones(injuryId);
    setMilestones(data);
    setIsLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const result = await createMilestone(injuryId, {
      milestone_date: newDate,
      milestone_type: newType,
      description: newDesc,
      completed: false,
    });
    if (result) {
      setMilestones((prev) => [...prev, result]);
      setShowForm(false);
      setNewDesc("");
    }
  }

  async function handleToggle(m: RecoveryMilestone) {
    const result = await updateMilestone(m.id, { completed: !m.completed });
    if (result) {
      setMilestones((prev) => prev.map((x) => (x.id === m.id ? result : x)));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this milestone?")) return;
    await deleteMilestone(id);
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Recovery Milestones ({milestones.length})</h4>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="rounded-lg border p-3 space-y-3 bg-muted/30">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-[10px]">Date</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Type</Label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as MilestoneType)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {Object.entries(milestoneMeta).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Description</Label>
              <Input
                placeholder="e.g. Pain-free squat achieved"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="h-7 text-xs">Save</Button>
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No milestones recorded. Add the first one.</p>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-muted-foreground/20" />
          <div className="space-y-3">
            {milestones.map((m) => {
              const meta = milestoneMeta[m.milestone_type];
              const Icon = meta.icon;
              return (
                <div key={m.id} className="relative flex items-start gap-3 pl-10">
                  <button
                    type="button"
                    onClick={() => handleToggle(m)}
                    className="absolute left-2.5 top-0.5"
                  >
                    {m.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      <span className={`text-xs font-medium ${m.completed ? "line-through text-muted-foreground" : ""}`}>
                        {m.description}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="ml-auto shrink-0"
                      >
                        <Trash2 className="h-3 w-3 text-destructive/60 hover:text-destructive" />
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {meta.label} &middot; {format(new Date(m.milestone_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
