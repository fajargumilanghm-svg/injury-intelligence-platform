"use client";

import { useAuth } from "@/context/auth-context";
import { RiskDashboard } from "@/components/injury-risk/risk-dashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Dumbbell, Heart } from "lucide-react";

export default function RiskDashboardPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Injury Risk Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time risk monitoring with trend analysis and heatmap visualization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/training"><Dumbbell className="mr-1.5 h-4 w-4" /> Training</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/wellness"><Heart className="mr-1.5 h-4 w-4" /> Wellness</Link>
          </Button>
        </div>
      </div>

      <RiskDashboard athleteId={athleteId} />
    </div>
  );
}
