"use client";

import { useAuth } from "@/context/auth-context";
import { RiskDashboard } from "@/components/injury-risk/risk-dashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, Dumbbell, Heart } from "lucide-react";

export default function RiskDashboardPage() {
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
