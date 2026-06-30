"use client";

import { useAuth } from "@/context/auth-context";
import { WellnessHistory } from "@/components/wellness/wellness-history";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WellnessHistoryPage() {
  const { athleteId } = useAuth();

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/wellness">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wellness History</h1>
          <p className="text-muted-foreground">
            Track your wellness trends over time
          </p>
        </div>
      </div>

      <WellnessHistory athleteId={athleteId} />
    </div>
  );
}
