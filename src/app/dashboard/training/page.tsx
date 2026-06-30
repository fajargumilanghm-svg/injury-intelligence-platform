"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { TrainingForm } from "@/components/training/training-form";
import { getTrainingEntries, getTrainingSummary, getTrainingTrend, deleteTraining } from "@/lib/supabase/training";
import type { TrainingEntry, TrainingSummary } from "@/types";
import { Loader2, Trash2, Dumbbell, Clock, Zap, TrendingUp, AlertTriangle, BarChart3, Sun } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

export default function TrainingPage() {
  const { athleteId } = useAuth();
  const [entries, setEntries] = useState<TrainingEntry[]>([]);
  const [trend, setTrend] = useState<{ date: string; load_score: number; duration: number; intensity: number }[]>([]);
  const [summary, setSummary] = useState<TrainingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (athleteId) loadData();
  }, [athleteId]);

  async function loadData() {
    const [entriesData, summaryData, trendData] = await Promise.all([
      getTrainingEntries(athleteId!),
      getTrainingSummary(athleteId!),
      getTrainingTrend(athleteId!, 30),
    ]);
    setEntries(entriesData);
    setSummary(summaryData);
    setTrend(trendData);
    setIsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this training entry?")) return;
    await deleteTraining(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    loadData();
  }

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

  function getAcwrStatus(acwr: number): { color: string; label: string } {
    if (acwr < 0.8) return { color: "text-amber-500", label: "Under training" };
    if (acwr <= 1.3) return { color: "text-green-500", label: "Optimal" };
    if (acwr <= 1.5) return { color: "text-amber-500", label: "Slightly high" };
    return { color: "text-red-500", label: "High risk" };
  }

  const loadCards = summary ? [
    { label: "Daily Load", value: summary.daily_load.toLocaleString(), icon: Sun, color: "text-orange-600 bg-orange-50", sub: "Today" },
    { label: "Weekly Load", value: summary.weekly_load.toLocaleString(), icon: BarChart3, color: "text-blue-600 bg-blue-50", sub: "Last 7 days" },
    { label: "Monthly Load", value: summary.monthly_load.toLocaleString(), icon: TrendingUp, color: "text-purple-600 bg-purple-50", sub: "Last 28 days" },
    { label: "Avg Intensity", value: `${summary.avg_intensity}/10`, icon: Zap, color: "text-green-600 bg-green-50", sub: "Session RPE" },
  ] : [];

  const acwrStatus = summary ? getAcwrStatus(summary.acwr) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Training Load</h1>
        <p className="text-muted-foreground">Log sessions and monitor load — Duration × RPE</p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="font-semibold mb-4">Log Training Session</h2>
        <TrainingForm athleteId={athleteId} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : entries.length > 0 && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loadCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`rounded-lg p-2 ${card.color}`}><Icon className="h-5 w-5" /></div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.sub}</span>
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border p-5">
              <h3 className="text-sm font-medium mb-4">Daily Load Trend (30 days)</h3>
              {trend.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval={4} />
                      <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="load_score" fill="hsl(221.2 83.2% 53.3%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-12 text-center">No data yet</p>
              )}
            </div>

            <div className="rounded-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Acute:Chronic Workload Ratio</h3>
                <AlertTriangle className={`h-4 w-4 ${acwrStatus?.color}`} />
              </div>
              <div className="text-center py-4">
                <span className={`text-5xl font-bold ${acwrStatus?.color}`}>{summary.acwr}</span>
                <p className={`mt-1 text-sm font-medium ${acwrStatus?.color}`}>{acwrStatus?.label}</p>
              </div>
              <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(summary.acwr / 2 * 100, 100)}%`,
                  backgroundColor: summary.acwr > 1.5 ? "#ef4444" : summary.acwr > 1.3 ? "#eab308" : "#22c55e",
                }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Acute (7d): {summary.acute_load}</span>
                <span>Chronic (28d): {summary.chronic_load}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-5">
            <h3 className="text-sm font-medium mb-4">Load & Intensity Trend</h3>
            {trend.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} className="text-muted-foreground" interval={4} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar yAxisId="left" dataKey="load_score" fill="hsl(221.2 83.2% 53.3%)" opacity={0.3} radius={[4, 4, 0, 0]} name="Load" />
                    <Line yAxisId="right" type="monotone" dataKey="intensity" stroke="#ef4444" strokeWidth={2} dot={false} name="RPE" />
                    <Line yAxisId="right" type="monotone" dataKey="duration" stroke="#22c55e" strokeWidth={2} dot={false} name="Duration (min)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">No data yet</p>
            )}
          </div>

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Duration</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">RPE</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Load</th>
                    <th className="px-4 py-3 text-right text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 20).map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-2.5 text-sm">{format(new Date(entry.training_date), "MMM d, yyyy")}</td>
                      <td className="px-4 py-2.5 text-sm capitalize">{entry.training_type.replace(/_/g, " ")}</td>
                      <td className="px-4 py-2.5 text-sm">{entry.duration_minutes} min</td>
                      <td className="px-4 py-2.5 text-sm">{entry.intensity_rpe}/10</td>
                      <td className="px-4 py-2.5 text-sm text-right font-medium">{entry.load_score}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {entries.length > 20 && (
              <p className="px-4 py-2 text-xs text-muted-foreground border-t">Showing 20 of {entries.length} entries</p>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Dumbbell className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No training data yet. Log your first session above.</p>
        </div>
      )}
    </div>
  );
}
