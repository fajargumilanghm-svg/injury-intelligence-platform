"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { ScreeningForm } from "@/components/physical-screening/screening-form";
import { ScreeningHistory } from "@/components/physical-screening/screening-history";
import { getScreenings } from "@/lib/supabase/physical-screening";
import type { PhysicalScreening } from "@/types";
import { Loader2, ClipboardList } from "lucide-react";

export default function PhysicalScreeningPage() {
  const { athleteId } = useAuth();
  const [screenings, setScreenings] = useState<PhysicalScreening[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (athleteId) loadScreenings();
  }, [athleteId]);

  async function loadScreenings() {
    const data = await getScreenings(athleteId!);
    setScreenings(data);
    setIsLoading(false);
  }

  function handleDelete(id: string) {
    setScreenings((prev) => prev.filter((s) => s.id !== id));
  }

  if (!athleteId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Athlete Profile Required</h2>
          <p className="text-muted-foreground">
            You need an athlete profile to view this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your administrator or refresh the page after setting up your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Physical Screening
        </h1>
        <p className="text-muted-foreground mt-1">
          Standardized assessments: FMS, Y Balance, Sit & Reach, Single Leg Hop, Countermovement Jump
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">New Screening Session</h2>
        <ScreeningForm athleteId={athleteId} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : screenings.length > 0 ? (
        <div>
          <h2 className="font-semibold mb-4">Test History ({screenings.length})</h2>
          <ScreeningHistory screenings={screenings} onDelete={handleDelete} />
        </div>
      ) : (
        <div className="text-center py-16">
          <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            No screenings recorded yet. Complete the form above to start tracking assessments.
          </p>
        </div>
      )}
    </div>
  );
}
