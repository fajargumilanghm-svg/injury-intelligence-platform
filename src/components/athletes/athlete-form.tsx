"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Athlete, Gender, DominantSide } from "@/types";

const athleteSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(1, "Age is required").max(120),
  gender: z.enum(["male", "female", "other"]),
  height: z.coerce.number().min(50, "Invalid height").max(300),
  weight: z.coerce.number().min(10, "Invalid weight").max(500),
  sport: z.string().min(2, "Sport is required"),
  playing_position: z.string().min(2, "Position is required"),
  dominant_side: z.enum(["left", "right", "ambidextrous"]),
  training_experience: z.string().min(2, "Experience is required"),
  previous_injury_history: z.string().optional(),
});

export type AthleteFormData = {
  full_name: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number;
  weight: number;
  sport: string;
  playing_position: string;
  dominant_side: "left" | "right" | "ambidextrous";
  training_experience: string;
  previous_injury_history?: string;
};

interface AthleteFormProps {
  defaultValues?: Athlete;
  onSubmit: (data: AthleteFormData) => Promise<void>;
  isSubmitting: boolean;
}

const genders: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const sides: { value: DominantSide; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "ambidextrous", label: "Ambidextrous" },
];

export function AthleteForm({ defaultValues, onSubmit, isSubmitting }: AthleteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AthleteFormData>({
    resolver: zodResolver(athleteSchema) as any,
    defaultValues: defaultValues
      ? {
          full_name: defaultValues.full_name,
          age: defaultValues.age,
          gender: defaultValues.gender,
          height: defaultValues.height,
          weight: defaultValues.weight,
          sport: defaultValues.sport,
          playing_position: defaultValues.playing_position,
          dominant_side: defaultValues.dominant_side,
          training_experience: defaultValues.training_experience,
          previous_injury_history: defaultValues.previous_injury_history ?? "",
        }
      : {
          gender: "male",
          dominant_side: "right",
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" placeholder="Athlete full name" {...register("full_name")} />
          {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input id="age" type="number" placeholder="25" {...register("age")} />
          {errors.age && <p className="text-sm text-destructive">{errors.age.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("gender")}
          >
            {genders.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input id="height" type="number" placeholder="175" {...register("height")} />
          {errors.height && <p className="text-sm text-destructive">{errors.height.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input id="weight" type="number" placeholder="75" {...register("weight")} />
          {errors.weight && <p className="text-sm text-destructive">{errors.weight.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sport">Sport</Label>
          <Input id="sport" placeholder="Basketball, Soccer, etc." {...register("sport")} />
          {errors.sport && <p className="text-sm text-destructive">{errors.sport.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="playing_position">Playing Position</Label>
          <Input id="playing_position" placeholder="Forward, Defender, etc." {...register("playing_position")} />
          {errors.playing_position && <p className="text-sm text-destructive">{errors.playing_position.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dominant_side">Dominant Side</Label>
          <select
            id="dominant_side"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("dominant_side")}
          >
            {sides.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {errors.dominant_side && <p className="text-sm text-destructive">{errors.dominant_side.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="training_experience">Training Experience</Label>
          <Input id="training_experience" placeholder="e.g. 5 years of professional training" {...register("training_experience")} />
          {errors.training_experience && <p className="text-sm text-destructive">{errors.training_experience.message}</p>}
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="previous_injury_history">Previous Injury History</Label>
          <textarea
            id="previous_injury_history"
            rows={4}
            placeholder="List any previous injuries, surgeries, or medical conditions..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...register("previous_injury_history")}
          />
          {errors.previous_injury_history && (
            <p className="text-sm text-destructive">{errors.previous_injury_history.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : defaultValues ? "Update Athlete" : "Add Athlete"}
        </Button>
      </div>
    </form>
  );
}
