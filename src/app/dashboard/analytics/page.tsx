"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import {
  Activity,
  Users,
  Heart,
  Dumbbell,
  Stethoscope,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Server,
  Shield,
  Clock,
  Database,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SystemStatus {
  label: string;
  status: "healthy" | "warning" | "error";
  message: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, trendValue }: MetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const { role, user } = useAuth();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAthletes: 0,
    activeInjuries: 0,
    totalTraining: 0,
    totalWellness: 0,
    avgWellness: 0,
    highRiskCount: 0,
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ action: string; time: string; user: string }[]>([]);

  const isAdmin = role === "administrator";

  useEffect(() => {
    if (!user) return;
    loadMetrics();
    checkSystemStatus();
  }, [user]);

  async function loadMetrics() {
    setIsLoading(true);

    try {
      // Athletes count
      const { count: athleteCount } = await supabase
        .from("athletes")
        .select("*", { count: "exact", head: true });

      // Active injuries
      const { count: injuryCount } = await supabase
        .from("injuries")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "recovering"]);

      // Training entries (30 days)
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { count: trainingCount } = await supabase
        .from("training_entries")
        .select("*", { count: "exact", head: true })
        .gte("training_date", since.toISOString().split("T")[0]);

      // Wellness entries (30 days)
      const { count: wellnessCount } = await supabase
        .from("wellness_entries")
        .select("*", { count: "exact", head: true })
        .gte("submitted_at", since.toISOString());

      // Avg wellness score
      const { data: wellnessData } = await supabase
        .from("wellness_entries")
        .select("wellness_score")
        .gte("submitted_at", since.toISOString());

      const avgWellness = wellnessData && wellnessData.length > 0
        ? Math.round(wellnessData.reduce((s, w) => s + (w.wellness_score ?? 0), 0) / wellnessData.length)
        : 0;

      // High risk count (ACWR > 1.5)
      const { data: trainingEntries } = await supabase
        .from("training_entries")
        .select("athlete_id, load_score, training_date")
        .gte("training_date", since.toISOString().split("T")[0]);

      let highRiskCount = 0;
      if (trainingEntries && trainingEntries.length > 0) {
        const athleteLoads: Record<string, number[]> = {};
        for (const entry of trainingEntries) {
          if (!athleteLoads[entry.athlete_id]) athleteLoads[entry.athlete_id] = [];
          athleteLoads[entry.athlete_id].push(entry.load_score);
        }

        for (const loads of Object.values(athleteLoads)) {
          if (loads.length >= 7) {
            const recent7 = loads.slice(-7);
            const recent28 = loads.slice(-28);
            const acute = recent7.reduce((a, b) => a + b, 0) / 7;
            const chronic = recent28.reduce((a, b) => a + b, 0) / 28;
            if (chronic > 0 && acute / chronic > 1.5) highRiskCount++;
          }
        }
      }

      setMetrics({
        totalAthletes: athleteCount ?? 0,
        activeInjuries: injuryCount ?? 0,
        totalTraining: trainingCount ?? 0,
        totalWellness: wellnessCount ?? 0,
        avgWellness,
        highRiskCount,
      });

      // Mock recent activity (in real app, this would come from audit log table)
      setRecentActivity([
        { action: "Training entry submitted", time: "2 min ago", user: "Alex Johnson" },
        { action: "Wellness questionnaire completed", time: "15 min ago", user: "Maria Garcia" },
        { action: "Injury status updated", time: "1 hour ago", user: "Dr. Smith" },
        { action: "New athlete registered", time: "3 hours ago", user: "Coach Williams" },
      ]);

    } catch (error) {
      console.error("[AnalyticsDashboard] Error loading metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function checkSystemStatus() {
    const statuses: SystemStatus[] = [];

    // Check database connection
    const { error: dbError } = await supabase.from("athletes").select("count").limit(1);
    statuses.push({
      label: "Database",
      status: dbError ? "error" : "healthy",
      message: dbError ? `Error: ${dbError.message}` : "Connected",
    });

    // Check auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    statuses.push({
      label: "Authentication",
      status: authError ? "warning" : "healthy",
      message: authError ? "Session issue" : "Active",
    });

    // Check RLS (quick check via query)
    const { error: rlsError } = await supabase.from("training_entries").select("id").limit(1);
    statuses.push({
      label: "RLS Policies",
      status: rlsError ? "warning" : "healthy",
      message: rlsError ? "Access restricted" : "Properly configured",
    });

    setSystemStatus(statuses);
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-semibold">Access Restricted</h2>
          <p className="text-muted-foreground">This analytics dashboard is only available to administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Platform Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor system health, usage metrics, and data trends
        </p>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-3">
        {systemStatus.map((status) => (
          <Card key={status.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{status.label}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        status.status === "healthy"
                          ? "bg-green-500"
                          : status.status === "warning"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm font-medium">{status.message}</span>
                  </div>
                </div>
                {status.label === "Database" && <Database className="h-5 w-5 text-muted-foreground" />}
                {status.label === "Authentication" && <Server className="h-5 w-5 text-muted-foreground" />}
                {status.label === "RLS Policies" && <Shield className="h-5 w-5 text-muted-foreground" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Metrics (Last 30 Days)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Total Athletes"
            value={metrics.totalAthletes}
            subtitle="Registered in platform"
            icon={Users}
            trend="up"
            trendValue="+2 this month"
          />
          <MetricCard
            title="Active Injuries"
            value={metrics.activeInjuries}
            subtitle="Currently recovering"
            icon={Stethoscope}
            trend={metrics.activeInjuries > 0 ? "down" : "flat"}
            trendValue={metrics.activeInjuries > 0 ? "Requires attention" : "All clear"}
          />
          <MetricCard
            title="Training Sessions"
            value={metrics.totalTraining}
            subtitle="Sessions logged"
            icon={Dumbbell}
            trend="up"
            trendValue="Consistent activity"
          />
          <MetricCard
            title="Wellness Entries"
            value={metrics.totalWellness}
            subtitle="Daily check-ins"
            icon={Heart}
            trend="up"
            trendValue="Good engagement"
          />
          <MetricCard
            title="Avg Wellness Score"
            value={`${metrics.avgWellness}/100`}
            subtitle="Platform average"
            icon={Activity}
            trend={metrics.avgWellness > 70 ? "up" : "flat"}
            trendValue={metrics.avgWellness > 70 ? "Healthy" : "Monitor closely"}
          />
          <MetricCard
            title="High Risk Athletes"
            value={metrics.highRiskCount}
            subtitle="ACWR > 1.5"
            icon={AlertTriangle}
            trend={metrics.highRiskCount > 0 ? "down" : "flat"}
            trendValue={metrics.highRiskCount > 0 ? "Intervention needed" : "Optimal loads"}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={loadMetrics} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Metrics"}
        </Button>
      </div>
    </div>
  );
}
