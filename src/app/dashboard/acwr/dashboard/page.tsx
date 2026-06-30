"use client";

import { useAuth } from "@/context/auth-context";
import { AcwrDashboard } from "@/components/acwr/acwr-dashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function AcwrDashboardPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">ACWR Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time ACWR monitoring with gauge visualization and risk assessment
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/training">
            <Dumbbell className="mr-2 h-4 w-4" /> Log Training
          </Link>
        </Button>
      </div>

      <AcwrDashboard athleteId={athleteId} />
    </div>
  );
}
