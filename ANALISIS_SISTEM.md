# Analisis Sistem — Injury Intelligence Platform

> **Tanggal:** 18 Juni 2026
> **Metode:** Superpowers systematic analysis (codebase audit + UI/UX review)

---

## 📋 Ringkasan Eksekutif

Platform **sudah bisa diakses** dan berjalan, namun memiliki beberapa **critical issue** yang harus diperbaiki sebelum production-ready. Skor keseluruhan: **6.5/10**.

| Area | Skor | Status |
|------|------|--------|
| Build & Deploy | 9/10 | ✅ Lancar |
| Database & Data Layer | 5/10 | ⚠️ Banyak issue |
| Pages & Routing | 6/10 | ⚠️ Missing routes + bug |
| UI/UX | 6.5/10 | ⚠️ Layak tapi banyak celah |
| Aksesibilitas | 4/10 | ❌ Perlu perbaikan serius |
| Keamanan | 5/10 | ⚠️ RLS + env var |
| Mobile Responsiveness | 6/10 | ⚠️ Lumayan tapi tidak konsisten |

---

## 🔴 CRITICAL (Harus diperbaiki)

### 1. Profile ID vs Athlete ID Mismatch
**Severity: CRITICAL — Data akan kosong**

Hampir **semua halaman dashboard** menggunakan `profile?.id` (dari tabel `user_profiles`) sebagai `athleteId`, padahal tabel data (`injuries`, `training_entries`, `wellness_entries`, dll) menggunakan `athletes.id` yang berbeda.

**Dampak:** Semua query akan return data kosong karena ID tidak cocok.

**File terdampak (~15 halaman):**
- `src/app/dashboard/injuries/page.tsx`
- `src/app/dashboard/training/page.tsx`
- `src/app/dashboard/wellness/page.tsx`
- `src/app/dashboard/predictive-ai/page.tsx`
- Semua halaman data lainnya

**Fix:** Setelah login, user harus memilih/membuat athlete profile, lalu menggunakan `athletes.id` untuk query.

### 2. Semua Supabase Error Handling = Silent Fail
**Severity: CRITICAL**

**Setiap file** di `src/lib/supabase/` menggunakan pola:
```ts
const { data } = await supabase.from("...").select("*");
return data ?? [];
```
Field `error` dari Supabase response **selalu diabaikan**. Jika query gagal (network error, RLS violation, etc.), fungsi return `[]` tanpa memberi tahu user.

**Fix:** Minimal tambahkan throw/console.error di semua fungsi, idealnya return `{ data, error }` agar komponen bisa handle.

### 3. Tidak Ada Middleware/Proxy Auth
Meskipun file `proxy.ts` sudah ada, **tidak ada proteksi route di server-side**. Proteksi hanya di client-side via `useAuth()` di layout, artinya:
- Halaman bisa "flash" (konten terlihat sebelum redirect)
- Route handler (`/auth/callback`) tidak punya validasi session
- Tidak ada session cookie refreshing

### 4. Prisma Schema Orphaned
**Severity: CRITICAL**

`prisma/schema.prisma` hanya mendefinisikan 2 model (`UserProfile`, `Notification`), sementara aplikasi menggunakan 9 tabel via Supabase. Jika ada yang menjalankan `npx prisma migrate`, semua tabel akan terhapus.

**Fix:** Hapus Prisma schema atau sync dengan Supabase schema.

### 5. Predictive Analytics = Math.random()
**Severity: HIGH**

Semua model ML (`predictive-ai.ts`, `predictive-analytics.ts`) adalah **simulasi**:
- Random Forest: sampel random + `Math.random()`
- XGBoost: loop dengan `Math.random()`
- Logistic Regression: hardcoded weights
- 4-week projection: decay factor buatan + `Math.random()`
- FMS score hardcoded ke `null` (feature tidak pernah dipakai)

---

## 🟠 HIGH PRIORITY

### 6. Missing Pages (5 routes 404)
Sidebar menampilkan link ke halaman yang tidak ada filenya:

| Route | Label |
|-------|-------|
| `/dashboard/assessments` | Assessments |
| `/dashboard/appointments` | Appointments |
| `/dashboard/messages` | Messages |
| `/dashboard/admin` | Admin |
| `/dashboard/settings` | Settings |

### 7. Tidak Ada Error Boundaries
**Tidak ada satu pun** file `error.tsx` di seluruh project. Jika terjadi error runtime, user akan melihat **white screen**.

Juga tidak ada `loading.tsx` — loading state hanya di-handle inline di beberapa komponen.

### 8. Wellbeing Score Calculation Bias
Di `wellness.ts`:
```ts
11 - entry.fatigue  // Invert: 1 → 10, 10 → 1
```
Menggunakan `11 - x` bukan `10 - x + 1`, jadi fatigue=1 jadi 10 (seharusnya 9). Ini menciptakan bias ke atas ~1.6 poin.

### 9. ACWR Calculation Tidak Akurat
```ts
acuteLoad = recentTraining.reduce(...) / 7;
chronicLoad = chronicEntries.reduce(...) / 28;
```
Membagi dengan 7/28 **berapa pun jumlah entri latihan**. Jika atlet latihan hanya 3 hari dalam seminggu, acute load tetap dibagi 7 → underestimated.

### 10. Missing CRUD Operations

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Athletes | ✅ | ✅ | ✅ | ✅ |
| Injuries | ✅ | ✅ | ✅ | ✅ |
| Training | ✅ | ✅ | ❌ | ✅ |
| Wellness | ✅ | ✅ | ❌ | ❌ |
| Screening | ✅ | ✅ | ❌ | ✅ |
| Notifications | ❌ | ❌ | ❌ | ❌ |

### 11. Export Fitur Tidak Berfungsi di Serverless
`excel-utils.ts` menggunakan `XLSX.writeFile()` yang mencoba menulis ke **server filesystem**. Di Vercel (serverless), ini akan gagal karena filesystem read-only.

---

## 🟡 MEDIUM PRIORITY

### 12. Mobile Navigation Rusak
`MobileSidebar.tsx` hanya menampilkan notifikasi — **tidak ada navigasi links**. User di mobile tidak bisa berpindah halaman.

### 13. Hardcoded Notification Badge
`TopNav.tsx` line 44: badge notifikasi **hardcoded = 3**, tidak terhubung ke `useNotifications` hook.

### 14. Metadata/SEO Minimal
Semua sub-page tidak punya metadata export — browser tab selalu "Injury Intelligence Platform" tanpa konteks halaman.

### 15. Tidak Ada Dark Mode
CSS variables cuma untuk light theme. Tidak ada dark mode media query atau class strategy.

### 16. Zona ACWR Chart Threshold Inkonsisten
`GaugeChart.tsx`, `TrainingAnalytics.tsx`, dan `load-heatmap.tsx` menggunakan hardcoded hex colors yang berbeda untuk zona yang sama. Sebaiknya jadi CSS custom properties.

### 17. Wellness Trend Calculation Salah Arah
Di `predictive-ai.ts` line 79-81, data wellness diurutkan descending (terbaru dulu), tapi trend dihitung sebagai `newer - older` → interpretasi terbalik.

### 18. Tidak Ada Pagination
Semua query list (athletes, injuries, training, wellness) fetch **semua data tanpa limit**. Akan bermasalah ketika data sudah ratusan/ratusan ribu.

---

## 🟢 LOW PRIORITY / SARAN

### 19. Aksesibilitas
- Tidak ada `aria-label` pada tombol navigasi, notification bell, menu toggle
- Chart SVG tidak punya `role="img"` atau `aria-label`
- Color-only encoding di heatmap (butuh texture/pattern untuk colorblind)
- Tidak ada `aria-live` untuk real-time updates dan error messages
- Password fields tidak punya visibility toggle
- Tidak ada focus trap di mobile sidebar

### 20. UI Polish
- Belum ada loading skeleton — inline spinner di beberapa tempat
- Form input tidak punya error state styling (border merah)
- Tidak ada "Remember me" di login
- Tidak ada password strength indicator di register
- Range slider untuk RPE tidak konsisten (wellness pakai slider, training pakai number input)
- Tidak ada confirmation dialog untuk delete actions

### 21. Performance
- Banyak fungsi pure didefinisikan di dalam komponen (re-created tiap render)
- SVG `id` glow filter bisa conflict kalau ada >1 GaugeChart
- Recharts bundle size besar (belum ada dynamic import)
- Tidak ada `useMemo` di banyak komponen yang komputasi berat

### 22. Developer Experience
- `auth.ts` campur aduk server & client exports tanpa `"use server"` directive
- Tidak ada logging/observability
- Tidak ada seed data untuk testing (sudah ada di SQL tapi belum jalan)
- Type safety bisa ditingkatkan (banyak `as any`)

---

## 📊 Kesimpulan & Rekomendasi

### Prioritas Perbaikan:

1. **🔥 Segera:** Fix athleteId di semua halaman + error handling Supabase
2. **🔥 Segera:** Setup proxy/middleware auth yang benar
3. **⚠️ Penting:** Tambah error boundaries + loading states
4. **⚠️ Penting:** Fix ACWR calculation + wellness score bias
5. **📋 Standar:** Tambah missing CRUD (training/wellness update)
6. **📋 Standar:** Fix export file di serverless
7. **💡 Saran:** Aksesibilitas + mobile nav + dark mode

### Timeline Estimasi:

| Package | Estimasi |
|---------|----------|
| Fix critical bugs (1-3) | 1-2 hari |
| Error handling + boundaries | 1 hari |
| Missing routes + CRUD | 1-2 hari |
| UI/UX polish | 2-3 hari |
| Aksesibilitas | 1-2 hari |
| **Total** | **6-10 hari** |

---

*Laporan digenerate menggunakan superpowers:systematic-debugging + superpowers:writing-plans*
