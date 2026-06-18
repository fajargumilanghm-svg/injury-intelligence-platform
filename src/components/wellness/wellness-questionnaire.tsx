"use client";

import { useState } from "react";
import { submitWellness, getTodayEntry } from "@/lib/supabase/wellness";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface WellnessSliderProps {
  label: string;
  minLabel: string;
  maxLabel: string;
  value: number;
  onChange: (value: number) => void;
  invert?: boolean;
}

function WellnessSlider({ label, minLabel, maxLabel, value, onChange }: WellnessSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm font-medium tabular-nums">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

interface WellnessQuestionnaireProps {
  athleteId: string;
}

export function WellnessQuestionnaire({ athleteId }: WellnessQuestionnaireProps) {
  const [sleepQuality, setSleepQuality] = useState(7);
  const [fatigue, setFatigue] = useState(4);
  const [muscleSoreness, setMuscleSoreness] = useState(4);
  const [stressLevel, setStressLevel] = useState(4);
  const [moodState, setMoodState] = useState(7);
  const [recoveryFeeling, setRecoveryFeeling] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const router = useRouter();

  const fields = [
    { label: "Sleep Quality", min: "Very poor", max: "Excellent", value: sleepQuality, setter: setSleepQuality },
    { label: "Fatigue", min: "No energy", max: "Fully energetic", value: fatigue, setter: setFatigue },
    { label: "Muscle Soreness", min: "Extreme soreness", max: "No soreness", value: muscleSoreness, setter: setMuscleSoreness },
    { label: "Stress Level", min: "Very stressed", max: "Completely relaxed", value: stressLevel, setter: setStressLevel },
    { label: "Mood State", min: "Very irritable", max: "Very positive", value: moodState, setter: setMoodState },
    { label: "Recovery Feeling", min: "Not recovered", max: "Fully recovered", value: recoveryFeeling, setter: setRecoveryFeeling },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const today = await getTodayEntry(athleteId);
    if (today) {
      setAlreadySubmitted(true);
      setIsSubmitting(false);
      return;
    }

    const result = await submitWellness(athleteId, {
      sleep_quality: sleepQuality,
      fatigue,
      muscle_soreness: muscleSoreness,
      stress_level: stressLevel,
      mood_state: moodState,
      recovery_feeling: recoveryFeeling,
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
        <h3 className="mt-4 text-lg font-semibold">Wellness Submitted</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Today&apos;s wellness data has been recorded.
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
        <h3 className="mt-4 text-lg font-semibold">Already Submitted Today</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ve already completed today&apos;s wellness questionnaire.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        {fields.map((field) => (
          <WellnessSlider
            key={field.label}
            label={field.label}
            minLabel={field.min}
            maxLabel={field.max}
            value={field.value}
            onChange={field.setter}
          />
        ))}
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Wellness Score</span>
          <span className="text-2xl font-bold text-primary">
            {Math.round(
              ((sleepQuality + (11 - fatigue) + (11 - muscleSoreness) + (11 - stressLevel) + moodState + recoveryFeeling) /
                60) * 100
            )}
          </span>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Wellness Data"}
      </Button>
    </form>
  );
}
