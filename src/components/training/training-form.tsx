"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { submitTraining, getTodayTraining } from "@/lib/supabase/training";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import type { TrainingType } from "@/types";

const trainingTypes: { value: TrainingType; label: string }[] = [
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "endurance", label: "Endurance" },
  { value: "agility", label: "Agility" },
  { value: "speed", label: "Speed" },
  { value: "flexibility", label: "Flexibility" },
  { value: "recovery", label: "Recovery" },
  { value: "sport_specific", label: "Sport Specific" },
  { value: "other", label: "Other" },
];

interface TrainingFormProps {
  athleteId: string;
}

export function TrainingForm({ athleteId }: TrainingFormProps) {
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split("T")[0]);
  const [trainingType, setTrainingType] = useState<TrainingType>("strength");
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const router = useRouter();

  const loadScore = duration * intensity;

  useEffect(() => {
    checkToday();
  }, []);

  async function checkToday() {
    const existing = await getTodayTraining(athleteId);
    if (existing) setAlreadySubmitted(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const existing = await getTodayTraining(athleteId);
    if (existing) {
      setAlreadySubmitted(true);
      setIsSubmitting(false);
      return;
    }

    const result = await submitTraining(athleteId, {
      training_date: trainingDate,
      training_type: trainingType,
      duration_minutes: duration,
      intensity_rpe: intensity,
      notes: notes || undefined,
    });

    setIsSubmitting(false);
    if (result) {
      setSubmitted(true);
      router.refresh();
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Training Logged</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s training session has been recorded.
        </p>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <CheckCircle2 className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Already Logged Today</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ve already recorded today&apos;s training.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="trainingDate">Training Date</Label>
        <Input
          id="trainingDate"
          type="date"
          value={trainingDate}
          onChange={(e) => setTrainingDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trainingType">Training Type</Label>
        <select
          id="trainingType"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={trainingType}
          onChange={(e) => setTrainingType(e.target.value as TrainingType)}
        >
          {trainingTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            max={600}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="intensity">Intensity (RPE 1-10)</Label>
          <Input
            id="intensity"
            type="number"
            min={1}
            max={10}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very light</span>
            <span>Maximal</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 space-y-1">
        <div className="flex justify-between text-sm">
          <span>Duration</span>
          <span className="font-medium tabular-nums">{duration} min</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Intensity (RPE)</span>
          <span className="font-medium tabular-nums">{intensity}/10</span>
        </div>
        <div className="border-t pt-2 mt-2 flex justify-between">
          <span className="font-semibold">Session Load (sRPE)</span>
          <span className="text-xl font-bold text-primary tabular-nums">{loadScore}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="How did the session feel?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Log Training Session"}
      </Button>
    </form>
  );
}
