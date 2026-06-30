"use client";

import { useAuth } from "@/context/auth-context";
import { RtpDashboard } from "@/components/injuries/rtp-dashboard";
import { Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function RtpDashboardPage() {
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Return to Play Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Recovery progress, RTP phase tracking, and clearance status
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/injuries">
            <Stethoscope className="mr-1.5 h-4 w-4" /> Injury Records
          </Link>
        </Button>
      </div>

      <RtpDashboard athleteId={athleteId} />
    </div>
  );
}
