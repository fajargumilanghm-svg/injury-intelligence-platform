"use client";

import { useAuth } from "@/context/auth-context";
import { InjuryRiskScore } from "@/components/injury-risk/injury-risk-score";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Activity, Dumbbell } from "lucide-react";

export default function InjuryRiskPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Injury Risk Score</h1>
          <p className="text-muted-foreground">
            Risk = Training Load(30%) + Fatigue(20%) + Sleep(15%) + Soreness(15%) + Injury History(10%) + Flexibility(10%)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/training"><Dumbbell className="mr-2 h-4 w-4" /> Training</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/wellness"><Activity className="mr-2 h-4 w-4" /> Wellness</Link>
          </Button>
        </div>
      </div>

      <InjuryRiskScore athleteId={athleteId} />
    </div>
  );
}
