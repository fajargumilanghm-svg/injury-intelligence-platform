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
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please set up your athlete profile first.</p>
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
