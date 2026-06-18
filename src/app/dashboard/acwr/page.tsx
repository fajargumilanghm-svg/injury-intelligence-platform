"use client";

import { useAuth } from "@/context/auth-context";
import { AcwrModule } from "@/components/acwr/acwr-module";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function AcwrPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">ACWR Engine</h1>
          <p className="text-muted-foreground">
            Acute:Chronic Workload Ratio — intelligence-driven injury risk assessment
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/training">
            <Dumbbell className="mr-2 h-4 w-4" /> Log Training
          </Link>
        </Button>
      </div>

      <AcwrModule athleteId={athleteId} />
    </div>
  );
}
