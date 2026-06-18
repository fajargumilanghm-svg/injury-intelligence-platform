"use client";

import { useAuth } from "@/context/auth-context";
import { AthleteReport } from "@/components/reports/athlete-report";
import { BarChart3 } from "lucide-react";

export default function AthleteReportPage() {
  const { profile } = useAuth();
  const athleteId = profile?.id;

  if (!athleteId) {
    return <div className="text-center py-12 text-muted-foreground">Please set up your athlete profile first.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <AthleteReport athleteId={athleteId} />
    </div>
  );
}
