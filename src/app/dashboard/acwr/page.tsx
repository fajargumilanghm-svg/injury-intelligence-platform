"use client";

import { useAuth } from "@/context/auth-context";
import { AcwrModule } from "@/components/acwr/acwr-module";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function AcwrPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ACWR Engine</h1>
          <p className="text-muted-foreground">
            Acute:Chronic Workload Ratio — intelligence-driven injury risk assessment
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/training">
            <Dumbbell className="mr-2 h-4 w-4" /> Log Training
          </Link>
        </Button>
      </div>

      <AcwrModule athleteId={athleteId} />
    </div>
  );
}
