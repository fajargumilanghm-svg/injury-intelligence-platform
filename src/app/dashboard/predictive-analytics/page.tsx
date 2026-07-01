"use client";

import { useState, useEffect } from "react";
import { getAthletes } from "@/lib/supabase/athletes";
import { AnalyticsDashboard } from "@/components/predictive-analytics/analytics-dashboard";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import type { Athlete } from "@/types";

export default function PredictiveAnalyticsPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAthletes();
  }, []);

  async function loadAthletes() {
    const data = await getAthletes();
    setAthletes(data);
    if (data.length > 0) setSelectedAthleteId(data[0].id);
    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Risk Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Rule-based injury risk assessment using athlete wellness and training data
        </p>
      </div>

      {athletes.length === 0 ? (
        <div className="text-center py-16">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Athletes Found</h3>
          <p className="text-sm text-muted-foreground">Add athletes before running predictions.</p>
          <Button className="mt-4" asChild>
            <a href="/dashboard/athletes/new">Add Athlete</a>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {athletes.map((a) => (
              <Button
                key={a.id}
                variant={selectedAthleteId === a.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAthleteId(a.id)}
              >
                {a.full_name}
              </Button>
            ))}
          </div>

          {selectedAthleteId && <AnalyticsDashboard athleteId={selectedAthleteId} />}
        </>
      )}
    </div>
  );
}
