# Critical Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 critical issues — middleware auth, error handling, athlete linking, prisma sync, and fake ML predictions.

**Architecture:** Sequential independent fixes — middleware first (rename), then data layer (error handling, prisma), then auth flow (athlete auto-create), dashboard UI polish, and finally predictive analytics rewrite.

**Tech Stack:** Next.js 16, Supabase, Prisma, TypeScript, React 19

## Global Constraints

- Next.js 16 — middleware must be at project root as `middleware.ts`
- Supabase client — must use existing supabase client factory pattern
- No new npm packages
- All dashboard pages follow existing layout pattern

---

## File Structure

### Modified Files

| File | Issue | Change |
|------|-------|--------|
| `proxy.ts` → `middleware.ts` | 3 | Rename + function rename |
| `src/lib/supabase/helpers.ts` | 2 | Minor update (already exists) |
| `src/lib/supabase/athletes.ts` | 2 | Add error handling |
| `src/lib/supabase/injuries.ts` | 2 | Add error handling |
| `src/lib/supabase/wellness.ts` | 2 | Add error handling |
| `src/lib/supabase/training.ts` | 2 | Add error handling |
| `src/lib/supabase/physical-screening.ts` | 2 | Add error handling |
| `src/lib/supabase/injury-risk.ts` | 2 | Add error handling |
| `src/lib/supabase/reports.ts` | 2 | Add error handling |
| `src/lib/supabase/team-intelligence.ts` | 2 | Add error handling |
| `src/lib/supabase/predictive-analytics.ts` | 5 | Rewrite (includes error handling) |
| `src/lib/supabase/predictive-ai.ts` | 5 | Rewrite (includes error handling) |
| `prisma/schema.prisma` | 4 | Sync with Supabase schema |
| `src/context/auth-context.tsx` | 1 | Auto-create athlete on null |
| `src/app/dashboard/*/page.tsx` (17 files) | 1 | Better fallback UI |
| `src/app/dashboard/predictive-analytics/page.tsx` | 5 | Update labels |
| `src/app/dashboard/predictive-ai/page.tsx` | 5 | Update labels |

---

### Task 1: Fix Middleware Auth (Issue 3)

**Files:**
- Rename: `proxy.ts` → `middleware.ts`
- Modify: `middleware.ts` — rename exported function

**Interfaces:**
- Consumes: existing `proxy.ts` contents
- Produces: working `middleware.ts` that Next.js 16 detects

- [ ] **Step 1: Rename proxy.ts to middleware.ts**

```bash
mv proxy.ts middleware.ts
```

- [ ] **Step 2: Rename exported function from `proxy` to `middleware`**

In `middleware.ts`, change:
```typescript
export async function proxy(request: NextRequest) {
```
to:
```typescript
export async function middleware(request: NextRequest) {
```

- [ ] **Step 3: Verify the file parses**

Run: `npx tsc --noEmit middleware.ts`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add middleware.ts proxy.ts
git commit -m "fix: rename proxy.ts to middleware.ts for Next.js 16 route protection"
```

---

### Task 2: Sync Prisma Schema (Issue 4)

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Consumes: existing `prisma/schema.prisma` + `supabase/migrations/00001_schema.sql`
- Produces: complete prisma schema matching database

- [ ] **Step 1: Read current schema and SQL migration**

```bash
cat prisma/schema.prisma
cat supabase/migrations/00001_schema.sql
```

- [ ] **Step 2: Rewrite prisma/schema.prisma with all tables and enums**

Replace entire file content with a schema that includes all 10 enums and 8+ models matching the SQL:

Enum list: `UserRole`, `Gender`, `DominantSide`, `TrainingType`, `InjurySeverity`, `InjuryStatus`, `InjuryMechanism`, `InjurySide`, `NotificationType`, `MilestoneType`, `RtpPhaseStatus`

Model list: `UserProfile`, `Notification`, `Athlete`, `Injury`, `RecoveryMilestone`, `RtpPhase`, `TrainingEntry`, `WellnessEntry`, `PhysicalScreening`

- [ ] **Step 3: Verify Prisma schema is valid**

Run: `npx prisma validate`
Expected: "Your Prisma schema is valid"

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "fix: sync Prisma schema with Supabase database tables"
```

---

### Task 3: Add Error Handling to Supabase Queries (Issue 2)

**Files:**
- Modify: `src/lib/supabase/helpers.ts` — ensure it exports useful error types
- Modify: `src/lib/supabase/athletes.ts` — add error handling
- Modify: `src/lib/supabase/injuries.ts` — add error handling
- Modify: `src/lib/supabase/wellness.ts` — add error handling
- Modify: `src/lib/supabase/training.ts` — add error handling
- Modify: `src/lib/supabase/physical-screening.ts` — add error handling
- Modify: `src/lib/supabase/injury-risk.ts` — add error handling
- Modify: `src/lib/supabase/reports.ts` — add error handling
- Modify: `src/lib/supabase/team-intelligence.ts` — add error handling

Note: Does NOT touch `predictive-analytics.ts` or `predictive-ai.ts` — those are rewritten in Task 6 which includes error handling.

**Interfaces:**
- Consumes: existing `src/lib/supabase/helpers.ts`
- Produces: all query functions with proper SupabaseError handling

- [ ] **Step 1: Update helpers.ts with SupabaseError class**

```typescript
// src/lib/supabase/helpers.ts
export class SupabaseError extends Error {
  constructor(
    message: string,
    public context: string,
    public originalError?: any
  ) {
    super(`[${context}] ${message}`);
    this.name = 'SupabaseError';
  }
}

export function handleError(error: any, context: string): void {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw new SupabaseError(error.message || 'Unknown error', context, error);
  }
}

export function handleData<T>(data: any, error: any, context: string): T[] {
  handleError(error, context);
  return (data as T[]) ?? [];
}

export function handleSingle<T>(data: any, error: any, context: string): T | null {
  handleError(error, context);
  return (data as T) ?? null;
}
```

- [ ] **Step 2: Update athletes.ts — add error handling**

Import helpers at top:
```typescript
import { handleData, handleSingle, handleError } from './helpers';
```

Replace all `const { data } = await ...` patterns with destructured error:
```typescript
const { data, error } = await supabase.from('athletes').select('*');
return handleData<Athlete>(data, error, 'athletes.getAll');
```

- [ ] **Step 3: Update injuries.ts — add error handling**

Same pattern — import helpers, destructure `{ data, error }`, use `handleData`/`handleSingle`.

- [ ] **Step 4: Update wellness.ts — add error handling**

Same pattern.

- [ ] **Step 5: Update training.ts — add error handling**

Same pattern. Note: this file has insert/delete operations that need `handleError`.

- [ ] **Step 6: Update physical-screening.ts — add error handling**

Same pattern.

- [ ] **Step 7: Update injury-risk.ts — add error handling**

This file uses `Promise.all` — ensure each destructured result has error checked:
```typescript
const [wellnessRes, trainingRes, athleteRes] = await Promise.all([
  supabase.from('wellness_entries').select('*').eq('athlete_id', athleteId),
  supabase.from('training_entries').select('*').eq('athlete_id', athleteId),
  supabase.from('athletes').select('*').eq('id', athleteId).single(),
]);
handleError(wellnessRes.error, 'injury-risk.wellness');
handleError(trainingRes.error, 'injury-risk.training');
handleError(athleteRes.error, 'injury-risk.athlete');
```

- [ ] **Step 8: Update reports.ts — add error handling**

Same pattern as athletes.ts.

- [ ] **Step 9: Update team-intelligence.ts — add error handling**

Same pattern.

- [ ] **Step 10: Build to verify types**

Run: `npm run build`
Expected: Build succeeds with no type errors

- [ ] **Step 11: Commit**

```bash
git add src/lib/supabase/
git commit -m "fix: add Supabase error handling to all query functions"
```

---

### Task 4: Auto-Create Athlete in Auth Context (Issue 1)

**Files:**
- Modify: `src/context/auth-context.tsx`

**Interfaces:**
- Consumes: existing `useAuth()` hook, supabase client
- Produces: automatic athlete creation when missing + updated athleteId

- [ ] **Step 1: Read current auth-context.tsx**

Read `src/context/auth-context.tsx` to understand current athlete lookup logic.

- [ ] **Step 2: Add auto-create athlete logic after existing lookup**

After the current athlete query at lines ~47-52, add:
```typescript
// If no athlete record found, auto-create one from profile
if (!athlete && currentUser) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .single();

  if (profile) {
    const { data: newAthlete, error: createError } = await supabase
      .from('athletes')
      .insert({
        user_id: currentUser.id,
        full_name: profile.full_name,
        email: profile.email,
        date_of_birth: null,
        gender: null,
        dominant_side: null,
        sport: null,
        position: null,
        team: null,
        avatar_url: profile.avatar_url,
      })
      .select('id')
      .single();

    if (!createError && newAthlete) {
      setAthleteId(newAthlete.id);
    }
  }
}
```

- [ ] **Step 3: Build to verify types**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/context/auth-context.tsx
git commit -m "fix: auto-create athlete record on login when missing"
```

---

### Task 5: Update Dashboard Pages Fallback UI (Issue 1)

**Files:**
- Modify: `src/app/dashboard/injuries/page.tsx` (and 16 other dashboard pages)

**Interfaces:**
- Consumes: athleteId from useAuth()
- Produces: actionable fallback UI when athleteId is null

- [ ] **Step 1: Update fallback in injuries/page.tsx**

Find the pattern:
```tsx
if (!athleteId) return <div>Please set up your athlete profile first.</div>;
```
Replace with:
```tsx
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
```

- [ ] **Step 2: Apply the same pattern to all 16 other dashboard pages**

Files to update:
- `src/app/dashboard/training/page.tsx`
- `src/app/dashboard/wellness/page.tsx`
- `src/app/dashboard/physical-screening/page.tsx`
- `src/app/dashboard/injury-risk/page.tsx`
- `src/app/dashboard/acwr/page.tsx`
- `src/app/dashboard/predictive-ai/page.tsx`
- `src/app/dashboard/injuries/rtp-dashboard/page.tsx`
- `src/app/dashboard/physical-screening/dashboard/page.tsx`
- `src/app/dashboard/acwr/dashboard/page.tsx`
- `src/app/dashboard/injury-risk/dashboard/page.tsx`
- `src/app/dashboard/wellness/dashboard/page.tsx`
- `src/app/dashboard/wellness/history/page.tsx`
- `src/app/dashboard/training/analytics/page.tsx`
- `src/app/dashboard/reports/downloads/page.tsx`
- `src/app/dashboard/reports/athlete/page.tsx`

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/
git commit -m "fix: improve athleteId fallback UI across all dashboard pages"
```

---

### Task 6: Rewrite Predictive Analytics as Rule-Based (Issue 5)

**Files:**
- Modify: `src/lib/supabase/predictive-analytics.ts` — rewrite rules, add error handling
- Modify: `src/lib/supabase/predictive-ai.ts` — rewrite rules, add error handling
- Modify: `src/app/dashboard/predictive-analytics/page.tsx` — update labels
- Modify: `src/app/dashboard/predictive-ai/page.tsx` — update labels

**Interfaces:**
- Consumes: `handleData`, `handleError` from helpers.ts, existing data types
- Produces: rule-based risk scoring without Math.random() or ML claims

- [ ] **Step 1: Rewrite predictive-analytics.ts (includes error handling)**

Also import and use `handleData`, `handleSingle`, `handleError` from `./helpers`.

Replace `Math.random()` based functions with:

```typescript
// Risk factors weighted formula
export function calculateRiskScore(athlete: {
  fatigue?: number;
  sleep_quality?: number;
  acute_chronic_ratio?: number;
  training_load_trend?: number;
  recent_injury_severity?: number;
}): number {
  const fatigue = athlete.fatigue ?? 5;
  const sleep = athlete.sleep_quality ?? 5;
  const acwr = athlete.acute_chronic_ratio ?? 1.0;
  const trend = athlete.training_load_trend ?? 0;
  const injuryPenalty = athlete.recent_injury_severity ?? 0;

  let score = 0;
  score += (fatigue / 10) * 25;
  score += ((10 - sleep) / 10) * 20;
  score += Math.max(0, (acwr - 1.0) / 1.5) * 30;
  score += Math.max(0, trend / 100) * 10;
  score += (injuryPenalty / 5) * 15;

  return Math.round(Math.min(99, Math.max(1, score)));
}

// Feature importance — proportional to actual weights
export function getFeatureImportance(athlete: any): Array<{ name: string; importance: number }> {
  return [
    { name: 'Acute:Chronic Ratio', importance: 30 },
    { name: 'Fatigue Level', importance: 25 },
    { name: 'Sleep Quality', importance: 20 },
    { name: 'Recent Injury Severity', importance: 15 },
    { name: 'Training Load Trend', importance: 10 },
  ];
}
```

Remove: `logisticRegression()`, `randomForest()`, `xgboost()`.

- [ ] **Step 2: Rewrite predictive-ai.ts**

Same approach — remove ML labels, use deterministic rule-based scoring.

- [ ] **Step 3: Update predictive-analytics/page.tsx labels**

Change headings:
- "AI-Powered Risk Analysis" → "Risk Analysis"
- "ML Model Predictions" → "Risk Factor Analysis"
- Remove all references to "Logistic Regression", "Random Forest", "XGBoost"

- [ ] **Step 4: Update predictive-ai/page.tsx labels**

Same label cleanup.

- [ ] **Step 5: Build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/predictive-analytics.ts src/lib/supabase/predictive-ai.ts src/app/dashboard/predictive-analytics/ src/app/dashboard/predictive-ai/
git commit -m "fix: replace Math.random() predictions with rule-based scoring"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All 5 critical issues from the spec are covered by 6 tasks above
- [ ] **Placeholder scan:** No TBD, TODO, or vague steps — all code is explicit
- [ ] **Type consistency:** All function signatures are self-contained within each task
