"use client";

import { useAuth } from "@/context/auth-context";
import { AiDashboard } from "@/components/predictive-ai/ai-dashboard";
import { BrainCircuit, Loader2, Sparkles } from "lucide-react";

export default function PredictiveAiPage() {
  const { profile } = useAuth();
  const athleteId = profile?.id;
  const isPremium = true;

  if (!athleteId) {
    return <div className="text-center py-12 text-muted-foreground">Please set up your athlete profile first.</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            Predictive Injury AI
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 ml-1">
              <Sparkles className="h-3 w-3" /> PREMIUM
            </span>
          </h1>
          <p className="text-muted-foreground mt-1">
            ML-powered injury risk prediction &mdash; 4-week forward projection with factor analysis
          </p>
        </div>
      </div>

      <AiDashboard athleteId={athleteId} />
    </div>
  );
}
