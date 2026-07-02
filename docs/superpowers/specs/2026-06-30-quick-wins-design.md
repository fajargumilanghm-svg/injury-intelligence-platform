# Quick Wins — High Priority Fixes

> **Date:** 2026-06-30
> **Scope:** 3 HIGH issues (error boundaries, wellbeing bias, ACWR calculation)

## Issue 1: Error Boundaries

### Problem
Tidak ada `error.tsx` di seluruh project. Jika error runtime terjadi di dashboard, user melihat white screen.

### Fix
Tambah `error.tsx` di `src/app/dashboard/` (root error boundary untuk semua sub-route dashboard). Gunakan pattern Next.js 16 error boundary.

### Approach
- Create `src/app/dashboard/error.tsx` — client component dengan fallback UI
- Show: error message, retry button, link back to dashboard
- Use existing Tailwind classes untuk styling

## Issue 2: Wellbeing Score Bias

### Problem
`calculateWellnessScore` di `src/lib/supabase/wellness.ts` menggunakan `11 - entry.fatigue`.

Fatigue scale: 1-10.
- `11 - 1 = 10` (seharusnya 9)
- `11 - 10 = 1` (benar)

Ini menciptakan bias ke atas ~1.6 poin karena max value jadi 10 bukan 9.

### Fix
Ubah formula menjadi `10 - entry.fatigue` (tanpa +1) agar range tetap 0-9, konsisten dengan 1-10 scale yang di-invert.

Atau lebih tepat: fatigue 1 → 9 (terbaik), fatigue 10 → 0 (terburuk). Formula: `10 - entry.fatigue`.

### Files
- `src/lib/supabase/wellness.ts` — line 10-12: ubah `11 -` menjadi `10 -`

## Issue 3: ACWR Calculation

### Problem
`getTrainingSummary` di `src/lib/supabase/training.ts` lines 116-119:

```typescript
const acuteLoad = weeklyLoad / 7;
const chronicLoad = entries.filter(...).reduce(...) / 28;
```

Membagi dengan 7 dan 28 **berapa pun jumlah hari yang sebenarnya ada data**. Jika atlet latihan hanya 3 hari dalam seminggu, acute load tetap dibagi 7 → underestimated.

### Fix
Hitung jumlah hari unik yang punya data training dalam window, lalu bagi dengan jumlah hari tersebut:

```typescript
const acuteDays = new Set(entries.filter(e => new Date(e.training_date) >= weekAgo).map(e => e.training_date)).size;
const chronicDays = new Set(entries.filter(e => new Date(e.training_date) >= monthAgo).map(e => e.training_date)).size;

const acuteLoad = acuteDays > 0 ? weeklyLoad / acuteDays : 0;
const chronicLoad = chronicDays > 0 ? monthlyLoad / chronicDays : 0;
```

### Files
- `src/lib/supabase/training.ts` — lines 116-119

## Test Plan
- `npm run build` — ensure no type errors
- `npm run lint` — check for new issues

## Rollback
Each fix is independent. Revert individual files if needed.
