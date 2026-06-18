"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAthlete } from "@/lib/supabase/athletes";
import { AthleteForm, type AthleteFormData } from "@/components/athletes/athlete-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewAthletePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function onSubmit(data: AthleteFormData) {
    setIsSubmitting(true);
    const athlete = await createAthlete({ ...data, previous_injury_history: data.previous_injury_history ?? null });
    setIsSubmitting(false);
    if (athlete) {
      router.push(`/dashboard/athletes/${athlete.id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/athletes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Athlete</h1>
          <p className="text-muted-foreground">Register a new athlete in the system</p>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <AthleteForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
