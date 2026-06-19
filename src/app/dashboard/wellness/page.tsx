"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { WellnessQuestionnaire } from "@/components/wellness/wellness-questionnaire";
import { WellnessHistory } from "@/components/wellness/wellness-history";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import type { Athlete } from "@/types";

export default function WellnessPage() {
  const { athleteId } = useAuth();
  const [athlete] = useState<Athlete | null>(null);

  if (!athleteId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please set up your athlete profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Wellness</h1>
          <p className="text-muted-foreground">
            Track your daily wellness metrics
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/wellness/history">
            <BarChart3 className="mr-2 h-4 w-4" /> View History
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="font-semibold mb-1">Today&apos;s Questionnaire</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Rate each metric on a scale of 1-10
        </p>
        <WellnessQuestionnaire athleteId={athleteId} />
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="font-semibold mb-4">Recent Entries</h2>
        <WellnessHistory athleteId={athleteId} compact />
      </div>
    </div>
  );
}
