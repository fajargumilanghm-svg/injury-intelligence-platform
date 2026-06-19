"use client";

import { useAuth } from "@/context/auth-context";
import { WellnessHistory } from "@/components/wellness/wellness-history";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WellnessHistoryPage() {
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/wellness">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wellness History</h1>
          <p className="text-muted-foreground">
            Track your wellness trends over time
          </p>
        </div>
      </div>

      <WellnessHistory athleteId={athleteId} />
    </div>
  );
}
