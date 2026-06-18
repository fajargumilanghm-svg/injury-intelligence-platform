"use client";

import { TeamDashboard } from "@/components/team-intelligence/team-dashboard";
import { BarChart3, Shield } from "lucide-react";

export default function TeamIntelligencePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Team Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Aggregate athlete metrics, risk heatmap, availability, and injury distribution
        </p>
      </div>

      <TeamDashboard />
    </div>
  );
}
