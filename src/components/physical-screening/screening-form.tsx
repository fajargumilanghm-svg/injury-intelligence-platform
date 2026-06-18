"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createScreening } from "@/lib/supabase/physical-screening";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronDown, ChevronRight, Activity, Scale, Ruler, ArrowRightLeft, Zap } from "lucide-react";

interface ScreeningFormProps {
  athleteId: string;
}

type CollapsibleSection = {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
};

const sections: CollapsibleSection[] = [
  { key: "fms", label: "FMS — Functional Movement Screen", icon: Activity, color: "text-blue-600" },
  { key: "ybt", label: "Y Balance Test (Lower Quarter)", icon: Scale, color: "text-purple-600" },
  { key: "sitreach", label: "Sit and Reach Test", icon: Ruler, color: "text-amber-600" },
  { key: "slh", label: "Single Leg Hop Test", icon: ArrowRightLeft, color: "text-green-600" },
  { key: "cmj", label: "Countermovement Jump", icon: Zap, color: "text-red-600" },
];

const fmsFields = [
  { id: "fms_deep_squat", label: "Deep Squat", desc: "Score 0-3" },
  { id: "fms_hurdle_step", label: "Hurdle Step", desc: "Score 0-3" },
  { id: "fms_inline_lunge", label: "Inline Lunge", desc: "Score 0-3" },
  { id: "fms_shoulder_mobility", label: "Shoulder Mobility", desc: "Score 0-3" },
  { id: "fms_active_slr", label: "Active Straight Leg Raise", desc: "Score 0-3" },
  { id: "fms_trunk_stability", label: "Trunk Stability Push-Up", desc: "Score 0-3" },
  { id: "fms_rotary_stability", label: "Rotary Stability", desc: "Score 0-3" },
];

const ybtFields = [
  { id: "ybt_leg_length", label: "Leg Length", unit: "cm", step: "0.1", placeholder: "85" },
  { id: "ybt_anterior_left", label: "Anterior (Left)", unit: "cm", step: "0.1", placeholder: "65" },
  { id: "ybt_anterior_right", label: "Anterior (Right)", unit: "cm", step: "0.1", placeholder: "66" },
  { id: "ybt_posteromedial_left", label: "Posteromedial (Left)", unit: "cm", step: "0.1", placeholder: "110" },
  { id: "ybt_posteromedial_right", label: "Posteromedial (Right)", unit: "cm", step: "0.1", placeholder: "112" },
  { id: "ybt_posterolateral_left", label: "Posterolateral (Left)", unit: "cm", step: "0.1", placeholder: "105" },
  { id: "ybt_posterolateral_right", label: "Posterolateral (Right)", unit: "cm", step: "0.1", placeholder: "107" },
];

export function ScreeningForm({ athleteId }: ScreeningFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setVal(id: string, v: string) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function getVal(id: string): number | undefined {
    const v = values[id];
    return v && v.trim() !== "" ? Number(v) : undefined;
  }

  const fmsTotal = fmsFields.reduce((sum, f) => {
    const v = getVal(f.id);
    return sum + (v !== undefined ? Math.min(3, Math.max(0, v)) : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    await createScreening(athleteId, {
      screening_date: date,
      fms_deep_squat: getVal("fms_deep_squat"),
      fms_hurdle_step: getVal("fms_hurdle_step"),
      fms_inline_lunge: getVal("fms_inline_lunge"),
      fms_shoulder_mobility: getVal("fms_shoulder_mobility"),
      fms_active_slr: getVal("fms_active_slr"),
      fms_trunk_stability: getVal("fms_trunk_stability"),
      fms_rotary_stability: getVal("fms_rotary_stability"),

      ybt_leg_length: getVal("ybt_leg_length"),
      ybt_anterior_left: getVal("ybt_anterior_left"),
      ybt_anterior_right: getVal("ybt_anterior_right"),
      ybt_posteromedial_left: getVal("ybt_posteromedial_left"),
      ybt_posteromedial_right: getVal("ybt_posteromedial_right"),
      ybt_posterolateral_left: getVal("ybt_posterolateral_left"),
      ybt_posterolateral_right: getVal("ybt_posterolateral_right"),

      sit_and_reach_cm: getVal("sit_and_reach_cm"),

      slh_left_cm: getVal("slh_left_cm"),
      slh_right_cm: getVal("slh_right_cm"),

      cmj_height_cm: getVal("cmj_height_cm"),
      cmj_peak_power_w: getVal("cmj_peak_power_w"),
      cmj_relative_power: getVal("cmj_relative_power"),

      notes: notes || undefined,
    });

    setIsSubmitting(false);
    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Screening Recorded</h3>
        <p className="mt-1 text-sm text-muted-foreground">All assessment data has been saved.</p>
      </div>
    );
  }

  function renderField(id: string, label: string, placeholder: string, unit?: string, step?: string, desc?: string) {
    return (
      <div key={id} className="space-y-1.5">
        <Label htmlFor={id} className="text-xs">{label}{unit ? ` (${unit})` : ""}</Label>
        {desc && <p className="text-[10px] text-muted-foreground">{desc}</p>}
        <Input
          id={id}
          type="number"
          step={step ?? "1"}
          placeholder={placeholder}
          className="h-8 text-sm"
          value={values[id] ?? ""}
          onChange={(e) => setVal(id, e.target.value)}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="date">Screening Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {sections.map((sec) => {
        const Icon = sec.icon;
        const isOpen = openSections[sec.key] ?? true;
        return (
          <div key={sec.key} className="rounded-lg border overflow-hidden">
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
              <div className="px-4 pb-4 pt-2 border-t">
                {sec.key === "fms" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Score each movement 0–3 (3 = perfect, 0 = pain)</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {fmsFields.map((f) => renderField(f.id, f.label, "0–3", undefined, undefined, f.desc))}
                    </div>
                    {fmsFields.some((f) => getVal(f.id) !== undefined) && (
                      <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                        <span className="font-medium">FMS Total</span>
                        <span className="font-bold tabular-nums">{fmsTotal} / 21</span>
                      </div>
                    )}
                  </div>
                )}

                {sec.key === "ybt" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Reach distances in cm for lower quarter Y Balance Test</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {ybtFields.map((f) => renderField(f.id, f.label, f.placeholder, f.unit, f.step))}
                    </div>
                  </div>
                )}

                {sec.key === "sitreach" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Standardized sit and reach flexibility test</p>
                    <div className="max-w-xs">
                      {renderField("sit_and_reach_cm", "Sit and Reach", "25", "cm", "0.1")}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Reference:</span>
                      <span className="tabular-nums">Excellent: &gt;37cm &middot; Good: 28–36cm &middot; Average: 17–27cm &middot; Poor: &lt;17cm</span>
                    </div>
                  </div>
                )}

                {sec.key === "slh" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Single leg hop for distance (cm)</p>
                    <div className="grid gap-3 sm:grid-cols-2 max-w-md">
                      {renderField("slh_left_cm", "Left Leg", "150", "cm")}
                      {renderField("slh_right_cm", "Right Leg", "155", "cm")}
                    </div>
                    {getVal("slh_left_cm") !== undefined && getVal("slh_right_cm") !== undefined && getVal("slh_right_cm") !== 0 && (
                      <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                        <span className="font-medium">Limb Symmetry Index (LSI)</span>
                        <span className="font-bold tabular-nums">
                          {Math.round(
                            (Math.min(getVal("slh_left_cm")!, getVal("slh_right_cm")!) /
                              Math.max(getVal("slh_left_cm")!, getVal("slh_right_cm")!)) *
                              100
                          )}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {sec.key === "cmj" && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-2">Countermovement Jump metrics</p>
                    <div className="grid gap-3 sm:grid-cols-3 max-w-lg">
                      {renderField("cmj_height_cm", "Jump Height", "40", "cm", "0.1")}
                      {renderField("cmj_peak_power_w", "Peak Power (optional)", "4500", "W")}
                      {renderField("cmj_relative_power", "Rel. Peak Power (optional)", "55", "W/kg", "0.1")}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Observations, asymmetries, or follow-up notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Screening Session"}
      </Button>
    </form>
  );
}
