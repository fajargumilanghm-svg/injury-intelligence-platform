# Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 3 HIGH priority issues — error boundaries, wellbeing score bias, ACWR calculation accuracy.

**Architecture:** Three independent fixes. Error boundary is a new file. Wellbeing and ACWR are small edits in existing lib files.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, Supabase

## Global Constraints

- Next.js 16 error boundary pattern (client component with `error` + `reset` props)
- No new npm packages
- All changes must build with `npm run build`

---

## File Structure

### New Files
| File | Task | Purpose |
|------|------|---------|
| `src/app/dashboard/error.tsx` | 1 | Next.js 16 error boundary for all dashboard routes |

### Modified Files
| File | Task | Purpose |
|------|------|---------|
| `src/lib/supabase/wellness.ts` | 2 | Fix `11 - x` bias to `10 - x` |
| `src/lib/supabase/training.ts` | 3 | Fix ACWR division by actual days with data |

---

### Task 1: Error Boundary for Dashboard

**Files:**
- Create: `src/app/dashboard/error.tsx`

**Interfaces:**
- Consumes: None (self-contained)
- Produces: Error boundary UI rendered by Next.js when any dashboard route throws

- [ ] **Step 1: Create error.tsx**

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">
          An error occurred while loading this page. Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: No TypeScript errors, no build failures

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/error.tsx
git commit -m "fix: add error boundary for dashboard routes"
```

---

### Task 2: Fix Wellbeing Score Bias

**Files:**
- Modify: `src/lib/supabase/wellness.ts` lines 10-12

**Interfaces:**
- Consumes: existing `WellnessEntry` type
- Produces: corrected `calculateWellnessScore` function

- [ ] **Step 1: Update the formula**

In `src/lib/supabase/wellness.ts`, change:
```typescript
const values = [
    entry.sleep_quality,
    11 - entry.fatigue,
    11 - entry.muscle_soreness,
    11 - entry.stress_level,
    entry.mood_state,
    entry.recovery_feeling,
  ];
```

To:
```typescript
const values = [
    entry.sleep_quality,
    10 - entry.fatigue,
    10 - entry.muscle_soreness,
    10 - entry.stress_level,
    entry.mood_state,
    entry.recovery_feeling,
  ];
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/wellness.ts
git commit -m "fix: correct wellbeing score bias (11-x → 10-x)"
```

---

### Task 3: Fix ACWR Calculation

**Files:**
- Modify: `src/lib/supabase/training.ts` lines 116-119

**Interfaces:**
- Consumes: existing `TrainingEntry[]` array
- Produces: accurate `acuteLoad` and `chronicLoad` values

- [ ] **Step 1: Read current code**

Read `src/lib/supabase/training.ts` lines 100-135 to understand the current calculation.

- [ ] **Step 2: Replace the division logic**

Replace:
```typescript
const acuteLoad = weeklyLoad / 7;
const chronicLoad = entries
    .filter((e) => new Date(e.training_date) >= monthAgo)
    .reduce((s, e) => s + e.load_score, 0) / 28;
```

With:
```typescript
const acuteEntries = entries.filter((e) => new Date(e.training_date) >= weekAgo);
const chronicEntries = entries.filter((e) => new Date(e.training_date) >= monthAgo);

const acuteDays = new Set(acuteEntries.map((e) => e.training_date)).size;
const chronicDays = new Set(chronicEntries.map((e) => e.training_date)).size;

const acuteLoad = acuteDays > 0 ? weeklyLoad / acuteDays : 0;
const chronicLoad = chronicDays > 0
  ? chronicEntries.reduce((s, e) => s + e.load_score, 0) / chronicDays
  : 0;
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/training.ts
git commit -m "fix: accurate ACWR calculation using actual days with data"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All 3 issues from the spec are covered
- [ ] **Placeholder scan:** No TBD, TODO, or vague steps
- [ ] **Type consistency:** All types used match existing codebase
