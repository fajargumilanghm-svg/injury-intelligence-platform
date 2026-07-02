"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
} from "@/lib/supabase/assessments";
import type { Assessment } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AssessmentsPage() {
  const { athleteId } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    assessment_date: "",
    type: "",
    score: "",
    notes: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (athleteId) {
      loadAssessments();
    }
  }, [athleteId]);

  async function loadAssessments() {
    if (!athleteId) return;
    setIsLoading(true);
    const data = await getAssessments(athleteId);
    setAssessments(data);
    setIsLoading(false);
  }

  function openAddDialog() {
    setEditingId(null);
    setForm({
      assessment_date: new Date().toISOString().slice(0, 10),
      type: "",
      score: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(assessment: Assessment) {
    setEditingId(assessment.id);
    setForm({
      assessment_date: assessment.assessment_date
        ? assessment.assessment_date.slice(0, 10)
        : "",
      type: assessment.type,
      score: String(assessment.score),
      notes: assessment.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!athleteId) return;
    if (!form.assessment_date || !form.type || form.score === "") {
      alert("Please fill in all required fields.");
      return;
    }

    const values = {
      assessment_date: form.assessment_date,
      type: form.type,
      score: Number(form.score),
      notes: form.notes || undefined,
    };

    if (editingId) {
      await updateAssessment(editingId, values);
    } else {
      await createAssessment(athleteId, values);
    }

    setDialogOpen(false);
    await loadAssessments();
  }

  function openDeleteDialog(id: string) {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    await deleteAssessment(deleteId);
    setDeleteDialogOpen(false);
    setDeleteId(null);
    await loadAssessments();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            Track your performance assessments over time
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Assessment
        </Button>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Notes
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : assessments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No assessments yet. Add your first assessment.
                  </td>
                </tr>
              ) : (
                assessments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{a.assessment_date}</td>
                    <td className="px-4 py-3 text-sm uppercase">{a.type}</td>
                    <td className="px-4 py-3 text-sm">{a.score}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {a.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(a)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(a.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Assessment" : "Add Assessment"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the assessment details below."
                : "Fill in the details for the new assessment."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.assessment_date}
                onChange={(e) =>
                  setForm({ ...form, assessment_date: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type || undefined}
                onValueChange={(value) => setForm({ ...form, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fms">FMS</SelectItem>
                  <SelectItem value="ybt">YBT</SelectItem>
                  <SelectItem value="cmj">CMJ</SelectItem>
                  <SelectItem value="slh">SLH</SelectItem>
                  <SelectItem value="sit_and_reach">Sit and Reach</SelectItem>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                value={form.score}
                onChange={(e) =>
                  setForm({ ...form, score: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
