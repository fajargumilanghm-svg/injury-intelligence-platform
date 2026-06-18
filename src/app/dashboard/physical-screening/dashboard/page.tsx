"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { ScreeningDashboard } from "@/components/physical-screening/screening-dashboard";
import { getScreenings } from "@/lib/supabase/physical-screening";
import type { PhysicalScreening } from "@/types";
import { Loader2, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList } from "lucide-react";

export default function PhysicalScreeningDashboardPage() {
  const { profile } = useAuth();
  const athleteId = profile?.id;
  const [screenings, setScreenings] = useState<PhysicalScreening[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (athleteId) loadScreenings();
  }, [athleteId]);

  async function loadScreenings() {
    const data = await getScreenings(athleteId!);
    setScreenings(data);
    setIsLoading(false);
  }

  if (!athleteId) {
    return <div className="text-center py-12 text-muted-foreground">Please set up your athlete profile first.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Screening Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Mobility, Stability, Asymmetry &mdash; composite scores from FMS, Y Balance, Sit &amp; Reach, and Single Leg Hop
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/physical-screening">
            <ClipboardList className="mr-1.5 h-4 w-4" /> View History
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <ScreeningDashboard screenings={screenings} />
      )}
    </div>
  );
}
