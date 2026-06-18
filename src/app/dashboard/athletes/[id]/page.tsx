"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAthlete, deleteAthlete } from "@/lib/supabase/athletes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Loader2, Ruler, Weight, Dumbbell, Activity } from "lucide-react";
import type { Athlete } from "@/types";
import { useRouter } from "next/navigation";

export default function AthleteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAthlete();
  }, [id]);

  async function loadAthlete() {
    const data = await getAthlete(id);
    setAthlete(data);
    setIsLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${athlete?.full_name}?`)) return;
    await deleteAthlete(id);
    router.push("/dashboard/athletes");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Athlete not found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard/athletes">Back to Athletes</Link>
        </Button>
      </div>
    );
  }

  const infoCards = [
    { label: "Sport", value: athlete.sport, icon: Dumbbell },
    { label: "Position", value: athlete.playing_position, icon: Activity },
    { label: "Height", value: `${athlete.height} cm`, icon: Ruler },
    { label: "Weight", value: `${athlete.weight} kg`, icon: Weight },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/athletes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{athlete.full_name}</h1>
            <p className="text-muted-foreground capitalize">
              {athlete.gender} &middot; {athlete.age} years old
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/athletes/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {infoCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="font-semibold">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Personal Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Full Name</dt>
              <dd className="text-sm font-medium">{athlete.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Age</dt>
              <dd className="text-sm font-medium">{athlete.age}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Gender</dt>
              <dd className="text-sm font-medium capitalize">{athlete.gender}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Dominant Side</dt>
              <dd className="text-sm font-medium capitalize">{athlete.dominant_side}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Training Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Sport</dt>
              <dd className="text-sm font-medium">{athlete.sport}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Playing Position</dt>
              <dd className="text-sm font-medium">{athlete.playing_position}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Experience</dt>
              <dd className="text-sm font-medium">{athlete.training_experience}</dd>
            </div>
          </dl>
        </div>
      </div>

      {athlete.previous_injury_history && (
        <div className="rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Previous Injury History</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {athlete.previous_injury_history}
          </p>
        </div>
      )}
    </div>
  );
}
