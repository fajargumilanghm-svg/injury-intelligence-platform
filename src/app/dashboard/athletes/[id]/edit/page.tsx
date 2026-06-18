"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAthlete, updateAthlete } from "@/lib/supabase/athletes";
import { AthleteForm, type AthleteFormData } from "@/components/athletes/athlete-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Athlete } from "@/types";

export default function EditAthletePage() {
  const { id } = useParams<{ id: string }>();
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadAthlete();
  }, [id]);

  async function loadAthlete() {
    const data = await getAthlete(id);
    setAthlete(data);
    setIsLoading(false);
  }

  async function onSubmit(data: AthleteFormData) {
    setIsSubmitting(true);
    const updated = await updateAthlete(id, { ...data, previous_injury_history: data.previous_injury_history ?? null });
    setIsSubmitting(false);
    if (updated) {
      router.push(`/dashboard/athletes/${id}`);
      router.refresh();
    }
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/athletes/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Athlete</h1>
          <p className="text-muted-foreground">Update {athlete.full_name}&apos;s information</p>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <AthleteForm
          defaultValues={athlete}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
