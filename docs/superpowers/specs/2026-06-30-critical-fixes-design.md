# Critical Fixes — Injury Intelligence Platform

> **Date:** 2026-06-30
> **Status:** Approved
> **Scope:** 5 critical issues only

## Issue 1: Athlete ID Mismatch

### Problem
`athleteId` from `useAuth()` comes from `athletes.user_id` lookup. Users without an athlete record (coaches, physios, or athletes whose `user_id` wasn't linked at creation) get `athleteId = null`. All dashboard pages show a dead-end message with no action to resolve.

### Fix
1. In `auth-context.tsx`, after the existing athlete lookup returns null, auto-create an athlete record using `user_profiles` data linked to the current auth user
2. For coach/physio roles, set `athleteId` to a sentinel or provide a context-aware ID (all athletes)
3. Update the "athleteId is null" fallback in dashboard pages to show a create-athlete form/link instead of a dead-end message

### Files Changed
- `src/context/auth-context.tsx` — auto-create athlete on null with `full_name`, `email` from profile
- `src/app/dashboard/*/page.tsx` — replace dead-end `<div>` with a card containing "Create Athlete Profile" button linking to onboarding flow (17 pages)

## Issue 2: Silent Fail in Supabase Queries

### Problem
All 13 `src/lib/supabase/*.ts` files ignore Supabase errors by destructuring only `data` and returning `data ?? []`. The `helpers.ts` file with `handleError()`, `handleData()`, `handleSingle()` exists but is never imported.

### Fix
1. Import and use `handleData<T>()`/`handleSingle<T>()` in every query function across all supabase lib files
2. Functions that previously returned `T[]` now throw a `SupabaseError` with context string and original error message
3. Add toast notifications for user-facing errors via the existing notification system

### Files Changed
- All files under `src/lib/supabase/`:
  - `athletes.ts`, `injuries.ts`, `wellness.ts`, `training.ts`
  - `physical-screening.ts`, `injury-risk.ts`, `reports.ts`
  - `team-intelligence.ts`, `predictive-analytics.ts`, `predictive-ai.ts`

## Issue 3: No Middleware/Server-Side Auth

### Problem
`proxy.ts` contains a complete auth middleware but is not named `middleware.ts`, so Next.js ignores it. No server-side route protection exists.

### Fix
1. Rename `proxy.ts` → `middleware.ts` at project root
2. Rename `export async function proxy` → `export async function middleware` inside the file
3. Verify the `config.matcher` correctly covers `/dashboard/*`, `/auth/*`

### Files Changed
- `proxy.ts` → `middleware.ts` (rename + function rename)

## Issue 4: Prisma Schema Orphaned

### Problem
Prisma schema defines only 2 models (`UserProfile`, `Notification`) while the database has 8+ tables. Running `npx prisma migrate` would drop all other tables.

### Fix
Sync Prisma schema with the actual Supabase SQL schema — add all missing models, enums, and relations:
- `athletes`, `injuries`, `recovery_milestones`, `rtp_phases`
- `training_entries`, `wellness_entries`, `physical_screenings`

### Files Changed
- `prisma/schema.prisma` — add all missing models and enums

## Issue 5: Predictive Analytics = Math.random()

### Problem
Both `predictive-analytics.ts` and `predictive-ai.ts` use `Math.random()` as core computation. UI falsely claims "ML-powered" with Logistic Regression, Random Forest, XGBoost labels.

### Fix
Replace all simulated ML with transparent **rule-based scoring**:
- Remove `Math.random()` calls entirely
- Weighted formula: `risk = (fatigue * 0.25) + ((10 - sleep_quality) * 0.20) + (acute_chronic_ratio * 0.30) + (recent_injury_penalty * 0.15) + (training_load_trend * 0.10)`
- Remove misleading "ML / AI / Logistic Regression / Random Forest / XGBoost" labels from UI — relabel as "Risk Analysis" and "Insights"
- Keep the visualization/insight structure but with honest labeling

### Files Changed
- `src/lib/supabase/predictive-analytics.ts` — rewrite as rule-based
- `src/lib/supabase/predictive-ai.ts` — rewrite as rule-based
- `src/app/dashboard/predictive-analytics/page.tsx` — update labels
- `src/app/dashboard/predictive-ai/page.tsx` — update labels

## Test Plan
- `npm run lint` — ensure no new lint errors
- `npm run build` — ensure project builds without errors
- Manual: login flow, dashboard rendering with data

## Rollback
Each issue fix is independent. If something goes wrong, revert individual files.
