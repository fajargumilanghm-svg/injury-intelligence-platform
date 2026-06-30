"use client";

import { useAuth } from "@/context/auth-context";
import { WellnessDashboard } from "@/components/wellness/wellness-dashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, BarChart3 } from "lucide-react";

export default function WellnessDashboardPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Wellness Dashboard</h1>
          <p className="text-muted-foreground">
            Visual overview of your wellness status and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/wellness">
              <ClipboardList className="mr-2 h-4 w-4" /> Submit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/wellness/history">
              <BarChart3 className="mr-2 h-4 w-4" /> History
            </Link>
          </Button>
        </div>
      </div>

      <WellnessDashboard athleteId={athleteId} />
    </div>
  );
}
