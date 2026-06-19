"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { InjuryForm } from "@/components/injuries/injury-form";
import { InjuryList } from "@/components/injuries/injury-list";
import { getInjuries } from "@/lib/supabase/injuries";
import type { InjuryRecord } from "@/types";
import { Loader2, Stethoscope, Plus, X } from "lucide-react";

export default function InjuriesPage() {
  const { athleteId } = useAuth();
  const [injuries, setInjuries] = useState<InjuryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (athleteId) loadInjuries();
  }, [athleteId]);

  async function loadInjuries() {
    const data = await getInjuries(athleteId!);
    setInjuries(data);
    setIsLoading(false);
  }

  function handleDelete(id: string) {
    setInjuries((prev) => prev.filter((i) => i.id !== id));
  }

  function handleUpdate(id: string, updated: Partial<InjuryRecord>) {
    setInjuries((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
  }

  function handleSaved() {
    setShowForm(false);
    if (athleteId) {
      getInjuries(athleteId).then(setInjuries);
    }
  }

  if (!athleteId) {
    return <div className="text-center py-12 text-muted-foreground">Please set up your athlete profile first.</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Injury Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track injuries, recovery milestones, and return-to-play progression
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? (
            <><X className="mr-1.5 h-4 w-4" /> Cancel</>
          ) : (
            <><Plus className="mr-1.5 h-4 w-4" /> New Injury</>
          )}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Record New Injury</h2>
          <InjuryForm athleteId={athleteId} onSaved={handleSaved} />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <InjuryList
          athleteId={athleteId}
          injuries={injuries}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
