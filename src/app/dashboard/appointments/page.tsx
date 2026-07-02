"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getAppointments, createAppointment, cancelAppointment } from "@/lib/supabase/appointments";
import type { Appointment } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, X } from "lucide-react";

export default function AppointmentsPage() {
  const { athleteId, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("consultation");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (athleteId) {
      loadAppointments();
    } else {
      setIsLoading(false);
    }
  }, [athleteId]);

  async function loadAppointments() {
    setIsLoading(true);
    const data = await getAppointments(athleteId!);
    setAppointments(data);
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!athleteId || !user?.id) return;
    setSubmitting(true);
    await createAppointment({
      athlete_id: athleteId,
      provider_id: user.id,
      appointment_date: formDate,
      type: formType,
      status: "scheduled",
      notes: formNotes || null,
    });
    setSubmitting(false);
    setOpen(false);
    resetForm();
    loadAppointments();
  }

  function resetForm() {
    setFormDate("");
    setFormType("consultation");
    setFormNotes("");
  }

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    await cancelAppointment(id);
    loadAppointments();
  }

  if (!athleteId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Athlete Profile Required</CardTitle>
            <CardDescription>
              You need an athlete profile to view appointments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator or refresh the page after setting up your profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage your appointments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Appointment</DialogTitle>
              <DialogDescription>
                Schedule a new appointment. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formType} onValueChange={setFormType} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Optional notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No appointments yet. Add your first appointment.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {new Date(appt.appointment_date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">{appt.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge
                        className={
                          appt.status === "scheduled"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : appt.status === "completed"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {appt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {appt.notes || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {appt.status === "scheduled" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancel(appt.id)}
                          title="Cancel appointment"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
