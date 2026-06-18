"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAthletes, deleteAthlete } from "@/lib/supabase/athletes";
import { Button } from "@/components/ui/button";
import type { Athlete } from "@/types";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAthletes();
  }, []);

  async function loadAthletes() {
    setIsLoading(true);
    const data = await getAthletes();
    setAthletes(data);
    setIsLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    await deleteAthlete(id);
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  }

  const filtered = athletes.filter((a) =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.sport.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Athletes</h1>
          <p className="text-muted-foreground">Manage all athletes in the platform</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/athletes/new">
            <Plus className="mr-2 h-4 w-4" /> Add Athlete
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search athletes..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Sport</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Age</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Gender</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Position</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {search ? "No athletes match your search" : "No athletes yet. Add your first athlete."}
                  </td>
                </tr>
              ) : (
                filtered.map((athlete) => (
                  <tr key={athlete.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{athlete.full_name}</td>
                    <td className="px-4 py-3 text-sm">{athlete.sport}</td>
                    <td className="px-4 py-3 text-sm">{athlete.age}</td>
                    <td className="px-4 py-3 text-sm capitalize">{athlete.gender}</td>
                    <td className="px-4 py-3 text-sm">{athlete.playing_position}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/athletes/${athlete.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/athletes/${athlete.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(athlete.id, athlete.full_name)}
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
    </div>
  );
}
