"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInjury, updateInjury } from "@/lib/supabase/injuries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Pencil } from "lucide-react";
import type { InjuryRecord, InjurySeverity, InjuryStatus, InjuryMechanism, InjurySide } from "@/types";

interface InjuryFormProps {
  athleteId: string;
  injury?: InjuryRecord | null;
  onSaved?: () => void;
}

const injuryTypes = [
  "Hamstring Strain", "Ankle Sprain", "ACL Tear", "MCL Tear", "Meniscus Tear",
  "Concussion", "Groin Strain", "Calf Strain", "Quad Strain", "Patellar Tendinopathy",
  "Achilles Tendinopathy", "Shin Splints", "Shoulder Dislocation", "Rotator Cuff Tear",
  "IT Band Syndrome", "Plantar Fasciitis", "Stress Fracture", "Contusion",
  "Laceration", "Other",
];

const bodyParts = [
  "Head", "Neck", "Shoulder", "Upper Arm", "Elbow", "Forearm", "Wrist", "Hand",
  "Upper Back", "Mid Back", "Lower Back", "Pelvis", "Hip", "Groin", "Thigh",
  "Knee", "Lower Leg", "Ankle", "Foot", "Toe",
];

export function InjuryForm({ athleteId, injury, onSaved }: InjuryFormProps) {
  const isEdit = !!injury;
  const [date, setDate] = useState(injury?.injury_date ?? new Date().toISOString().split("T")[0]);
  const [injuryType, setInjuryType] = useState(injury?.injury_type ?? "");
  const [bodyPart, setBodyPart] = useState(injury?.body_part ?? "");
  const [severity, setSeverity] = useState<InjurySeverity>(injury?.severity ?? "minor");
  const [mechanism, setMechanism] = useState<InjuryMechanism | "">(injury?.mechanism ?? "");
  const [side, setSide] = useState<InjurySide>(injury?.side ?? "right");
  const [diagnosis, setDiagnosis] = useState(injury?.diagnosis ?? "");
  const [status, setStatus] = useState<InjuryStatus>(injury?.status ?? "active");
  const [estDays, setEstDays] = useState(injury?.estimated_recovery_days ? String(injury.estimated_recovery_days) : "");
  const [expectedReturnDate, setExpectedReturnDate] = useState(injury?.expected_return_date ?? "");
  const [actualReturnDate, setActualReturnDate] = useState(injury?.actual_return_date ?? "");
  const [rtpDate, setRtpDate] = useState(injury?.return_to_play_date ?? "");
  const [treatmentNotes, setTreatmentNotes] = useState(injury?.treatment_notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (injury) {
      setDate(injury.injury_date ?? "");
      setInjuryType(injury.injury_type ?? "");
      setBodyPart(injury.body_part ?? "");
      setSeverity(injury.severity ?? "minor");
      setMechanism(injury.mechanism ?? "");
      setSide(injury.side ?? "right");
      setDiagnosis(injury.diagnosis ?? "");
      setStatus(injury.status ?? "active");
      setEstDays(injury.estimated_recovery_days ? String(injury.estimated_recovery_days) : "");
      setExpectedReturnDate(injury.expected_return_date ?? "");
      setActualReturnDate(injury.actual_return_date ?? "");
      setRtpDate(injury.return_to_play_date ?? "");
      setTreatmentNotes(injury.treatment_notes ?? "");
    }
  }, [injury]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      injury_date: date,
      injury_type: injuryType,
      body_part: bodyPart,
      severity,
      mechanism: (mechanism || null) as InjuryMechanism | null,
      side,
      diagnosis: diagnosis || null,
      status,
      estimated_recovery_days: estDays ? Number(estDays) : null,
      actual_recovery_days: injury?.actual_recovery_days ?? null,
      expected_return_date: expectedReturnDate || null,
      actual_return_date: actualReturnDate || null,
      return_to_play_date: rtpDate || null,
      treatment_notes: treatmentNotes || null,
    };

    if (isEdit && injury) {
      await updateInjury(injury.id, payload);
    } else {
      await createInjury(athleteId, payload);
    }

    setIsSubmitting(false);
    setSubmitted(true);
    router.refresh();
    onSaved?.();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h3 className="mt-3 text-base font-semibold">{isEdit ? "Injury Updated" : "Injury Recorded"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit ? "Changes have been saved." : "The injury has been logged."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isEdit && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <Pencil className="h-4 w-4" />
          Editing: {injury!.injury_type} ({injury!.body_part})
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="injury_date">Date of Injury</Label>
          <Input id="injury_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="side">Side</Label>
          <select
            id="side"
            value={side}
            onChange={(e) => setSide(e.target.value as InjurySide)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="bilateral">Bilateral</option>
            <option value="n/a">N/A</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="injury_type">Injury Type</Label>
          <select
            id="injury_type"
            value={injuryType}
            onChange={(e) => setInjuryType(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select type...</option>
            {injuryTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="body_part">Injury Location</Label>
          <select
            id="body_part"
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            required
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select location...</option>
            {bodyParts.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="severity">Injury Severity</Label>
          <select
            id="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as InjurySeverity)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="minor">Minor</option>
            <option value="moderate">Moderate</option>
            <option value="severe">Severe</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mechanism">Mechanism</Label>
          <select
            id="mechanism"
            value={mechanism}
            onChange={(e) => setMechanism(e.target.value as InjuryMechanism | "")}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Not specified</option>
            <option value="contact">Contact</option>
            <option value="non_contact">Non-Contact</option>
            <option value="overuse">Overuse</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as InjuryStatus)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="active">Active</option>
            <option value="recovering">Recovering</option>
            <option value="recovered">Recovered</option>
            <option value="chronic">Chronic</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="diagnosis">Diagnosis</Label>
        <Input
          id="diagnosis"
          placeholder="e.g. Grade 2 hamstring strain"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="estDays">Est. Recovery (days)</Label>
          <Input id="estDays" type="number" min={1} placeholder="e.g. 21" value={estDays} onChange={(e) => setEstDays(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expected_return_date">Expected Return Date</Label>
          <Input id="expected_return_date" type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="actual_return_date">Actual Return Date</Label>
          <Input id="actual_return_date" type="date" value={actualReturnDate} onChange={(e) => setActualReturnDate(e.target.value)} />
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="rtp_date">Return to Play Date</Label>
          <Input id="rtp_date" type="date" value={rtpDate} onChange={(e) => setRtpDate(e.target.value)} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="treatment">Treatment Notes</Label>
        <textarea
          id="treatment"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Physiotherapy, medication, RICE, etc."
          value={treatmentNotes}
          onChange={(e) => setTreatmentNotes(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEdit ? "Update Injury Record" : "Record Injury"}
      </Button>
    </form>
  );
}
