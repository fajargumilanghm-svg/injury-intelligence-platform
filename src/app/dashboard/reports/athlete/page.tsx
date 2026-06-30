"use client";

import { useAuth } from "@/context/auth-context";
import { AthleteReport } from "@/components/reports/athlete-report";
import { BarChart3 } from "lucide-react";

export default function AthleteReportPage() {
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
    <div className="max-w-6xl mx-auto">
      <AthleteReport athleteId={athleteId} />
    </div>
  );
}
