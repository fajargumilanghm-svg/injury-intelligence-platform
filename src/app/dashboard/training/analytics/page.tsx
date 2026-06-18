"use client";

import { useAuth } from "@/context/auth-context";
import { TrainingAnalytics } from "@/components/training/training-analytics";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Dumbbell } from "lucide-react";

export default function TrainingAnalyticsPage() {
  const { profile } = useAuth();
  const athleteId = profile?.id;

  if (!athleteId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please set up your athlete profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/training">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Training Analytics</h1>
            <p className="text-muted-foreground">
              Deep dive into training load patterns and ACWR intelligence
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/training">
            <Dumbbell className="mr-2 h-4 w-4" /> Log Training
          </Link>
        </Button>
      </div>

      <TrainingAnalytics athleteId={athleteId} />
    </div>
  );
}
