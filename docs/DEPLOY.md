# 🚀 Deployment Guide — Injury Intelligence Platform

> **Versi:** 1.0  
> **Tanggal:** Juli 2026  
> **Platform:** Next.js 16 + Supabase + Vercel

---

## 📋 Prerequisites

Sebelum mulai, pastikan Anda punya:

| # | Requirement | Catatan |
|---|-------------|---------|
| 1 | **Node.js 18+** | Direkomendasikan: v20+ |
| 2 | **npm / pnpm / bun** | Gunakan pnpm untuk performa lebih baik |
| 3 | **Git** | Untuk version control |
| 4 | **Akun Supabase** | [https://supabase.com](https://supabase.com) |
| 5 | **Akun Vercel** | [https://vercel.com](https://vercel.com) |
| 6 | **Supabase CLI** | `npm i -g supabase` atau `brew install supabase` |

---

## 🔧 Langkah 1: Setup Supabase Project

### 1.1. Buat Project Baru di Supabase

1. Buka [https://app.supabase.com](https://app.supabase.com)
2. Klik **New Project**
3. Pilih organisasi → beri nama project (misal: `injury-intelligence`)
4. Set database password → pilih region terdekat (Singapore untuk Asia)
5. Tunggu ~2 menit sampai project ready

### 1.2. Dapatkan API Credentials

Di Supabase Dashboard → Project Settings → API:

```
Project URL:     https://<project-ref>.supabase.co
Anon Key:        eyJhbGciOiJIUzI1NiIs...
Service Role:    eyJhbGciOiJIUzI1NiIs...  (RAHASIA!)
```

### 1.3. Setup Environment Variables

Buat file `.env.local` di root project:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Database (opsional, untuk Prisma/direct SQL)
DATABASE_URL=postgresql://postgres:[password]@db.<project-ref>.supabase.co:5432/postgres
```

**⚠️ PENTING:**
- `SUPABASE_SERVICE_ROLE_KEY` **hanya** untuk server-side (API routes, middleware)
- Jangan pernah expose Service Role Key ke client/browser
- Gunakan `.env.local` untuk local, Vercel Environment Variables untuk production

---

## 🗄️ Langkah 2: Database Migration

### 2.1. Jalankan Migration Berurutan

Buka **Supabase SQL Editor** (Dashboard → SQL Editor) dan jalankan dari atas ke bawah:

#### Migration 00001 — Schema Dasar
```bash
# Buka file: supabase/migrations/00001_schema.sql
# Copy seluruh isi → Paste ke SQL Editor → Run
```

#### Migration 00002 — Tabel Tambahan
```bash
# Buka file: supabase/migrations/00002_new_tables.sql
# Copy seluruh isi → Paste ke SQL Editor → Run
```

#### Migration 00003 — RLS Hardening (Assessments & Appointments)
```bash
# Buka file: supabase/migrations/00003_rls_fix.sql
# Copy seluruh isi → Paste ke SQL Editor → Run
```

#### Migration 00004 — RLS Hardening (7 Core Tables)
```bash
# Buka file: supabase/migrations/00004_rls_hardening.sql
# Copy seluruh isi → Paste ke SQL Editor → Run
```

### 2.2. Verifikasi Migration

Jalankan query verifikasi di SQL Editor:

```sql
-- Cek semua tabel yang dibuat
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Cek RLS policies (harus ada yang berakhiran _scoped)
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Cek helper function is_staff_or_admin
SELECT proname FROM pg_proc WHERE proname = 'is_staff_or_admin';
```

**Hasil yang diharapkan:**
- 11+ tabel terdaftar (athletes, injuries, training_entries, dll)
- Policies dengan suffix `_scoped` untuk tabel core
- Function `is_staff_or_admin` ada di list

---

## 🌱 Langkah 3: Seed Data

### 3.1. Buat User Auth Pertama

Sebelum seed data, Anda butuh minimal 1 user di Supabase Auth:

**Cara A: Via UI (Direkomendasikan untuk admin pertama)**
1. Supabase Dashboard → Authentication → Users
2. Klik **Add User** → masukkan email & password
3. Set user ini sebagai admin nanti di langkah 3.3

**Cara B: Via Registration di App**
1. Jalankan app local: `npm run dev`
2. Buka `http://localhost:3000/auth/register`
3. Register dengan email real Anda
4. Verifikasi email (check inbox)

### 3.2. Jalankan Seed SQL

```bash
# Buka file: supabase/seed.sql
# Copy seluruh isi → Paste ke SQL Editor → Run
```

**⚠️ Catatan:** Seed data menggunakan `CURRENT_DATE` sehingga training entries akan terisi otomatis dengan tanggal relatif ke hari ini.

### 3.3. Set Role Admin untuk User Pertama

```sql
-- Ganti 'your-email@example.com' dengan email admin
UPDATE user_profiles
SET role = 'administrator'
WHERE email = 'your-email@example.com';
```

---

## 💻 Langkah 4: Local Development

### 4.1. Install Dependencies

```bash
npm install
# atau
pnpm install
```

### 4.2. Jalankan Dev Server

```bash
npm run dev
```

Buka browser: [http://localhost:3000](http://localhost:3000)

### 4.3. Test Build Production

```bash
npm run build
```

**Harus passing** tanpa TypeScript errors.

---

## 🚀 Langkah 5: Deploy ke Vercel

### 5.1. Connect GitHub Repo

1. Push code ke GitHub repository
2. Buka [https://vercel.com](https://vercel.com) → Dashboard
3. Klik **Add New...** → **Project**
4. Import repository GitHub Anda
5. Pilih framework: **Next.js** (auto-detect)

### 5.2. Configure Environment Variables

Di Vercel Dashboard → Project Settings → Environment Variables, tambahkan:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production |

### 5.3. Deploy

Klik **Deploy** di Vercel Dashboard.

Tunggu ~2-3 menit. Setelah selesai, Vercel akan memberikan URL production.

### 5.4. Update Supabase Redirect URLs

Di Supabase Dashboard → Authentication → URL Configuration:

```
Site URL: https://your-domain.vercel.app
Redirect URLs:
  - http://localhost:3000/auth/callback
  - https://your-domain.vercel.app/auth/callback
```

---

## 🔐 Langkah 6: Post-Deploy Security Checklist

### 6.1. RLS Verification

Jalankan lagi di SQL Editor:

```sql
-- Pastikan tidak ada policy lama yang masih aktif
SELECT tablename, policyname FROM pg_policies 
WHERE policyname NOT LIKE '%_scoped' 
AND tablename IN ('athletes','injuries','training_entries','wellness_entries','physical_screenings','recovery_milestones','rtp_phases');
```

**Hasil harus:** 0 rows (semua policy sudah di-replace dengan yang scoped)

### 6.2. Auth Callback URL

Pastikan OAuth callback bekerja:
1. Buka `https://your-domain.vercel.app/auth/login`
2. Klik "Sign in with Google" (jika di-setup)
3. Harus redirect kembali ke `/dashboard`

### 6.3. Role-Based Access

| Test | Expected |
|------|----------|
| Login sebagai `athlete` → akses `/dashboard/admin` | Redirect ke `/dashboard` |
| Login sebagai `administrator` → akses `/dashboard/admin` | Halaman admin muncul |
| Login sebagai `athlete` → akses `/dashboard/team-intelligence` | Redirect ke `/dashboard` |
| Login sebagai `coach` → akses `/dashboard/team-intelligence` | Halaman muncul |

---

## 🧪 Langkah 7: End-to-End Testing

Gunakan script health check yang sudah disediakan:

```bash
# Jalankan health check (memerlukan .env.local)
npx tsx scripts/health-check.ts
```

### Manual Testing Checklist

| # | Fitur | Cara Test | Expected |
|---|-------|-----------|----------|
| 1 | **Register** | `/auth/register` → isi form | Redirect ke login, email verification sent |
| 2 | **Login** | `/auth/login` → email + pass | Redirect ke `/dashboard` |
| 3 | **Auto Athlete Profile** | Setelah login pertama | `athleteId` tidak null di localStorage/context |
| 4 | **Create Training** | `/dashboard/training` → isi form | Entry muncul di list |
| 5 | **Update Training** | Klik edit di training list | Data terupdate |
| 6 | **Delete Training** | Klik delete → confirm | Entry hilang |
| 7 | **Create Wellness** | `/dashboard/wellness` → isi form | Entry muncul di history |
| 8 | **ACWR Calculation** | `/dashboard/acwr/dashboard` | Nilai ACWR terhitung (bukan 0) |
| 9 | **Injury CRUD** | `/dashboard/injuries` → add/edit/delete | Semua operasi berjalan |
| 10 | **Export Excel** | `/dashboard/reports/downloads` → click export | File .xlsx ter-download |
| 11 | **Dark Mode** | Klik 🌙/☀️ di navbar | UI berubah warna |
| 12 | **Mobile Nav** | Resize ke mobile → click hamburger | Sidebar muncul dengan link navigasi |
| 13 | **Notifications** | Badge di navbar | Menampilkan real count (bukan hardcoded) |
| 14 | **Admin Panel** | Login as admin → `/dashboard/admin` | Daftar users muncul, bisa update role |
| 15 | **Real-time** | Submit data di tab A, lihat tab B | Data muncul tanpa refresh (Supabase realtime) |

---

## 🔁 Langkah 8: CI/CD (Opsional tapi Direkomendasikan)

### GitHub Actions Workflow

Buat file `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm run lint
```

### Auto-Deploy ke Vercel

Vercel sudah auto-deploy setiap kali push ke `main`. Untuk branch preview:
1. Push ke branch baru: `git push origin feature/x`
2. Vercel otomatis buat Preview Deployment
3. Komentar di PR dengan URL preview

---

## 🆘 Troubleshooting

### Error: "new row violates row-level security policy"

**Penyebab:** `athletes.user_id` NULL atau tidak cocok dengan `auth.uid()`  
**Fix:**
```sql
-- Cek athletes tanpa user_id
SELECT id, full_name, user_id FROM athletes WHERE user_id IS NULL;

-- Update (hanya untuk development!)
UPDATE athletes SET user_id = 'auth-user-uuid-here' WHERE id = 'athlete-uuid';
```

### Error: "relation does not exist"

**Penyebab:** Migration belum dijalankan  
**Fix:** Jalankan migration 00001-00004 di SQL Editor

### Error: "Failed to compile" saat build

**Penyebab:** TypeScript error atau dependency missing  
**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: "Auth session missing" di production

**Penyebab:** Supabase redirect URL belum di-configure  
**Fix:** Update redirect URLs di Supabase Dashboard → Auth → URL Configuration

### Data tidak muncul setelah migration 00004

**Penyebab:** RLS policy menolak karena `athletes.user_id` tidak cocok  
**Fix:** Pastikan `user_id` di tabel `athletes` sesuai dengan `auth.users.id`

---

## 📚 Referensi

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Supabase Auth Deep Dive](https://supabase.com/docs/guides/auth)

---

## ✅ Deployment Checklist

- [ ] Supabase project dibuat & API keys didapat
- [ ] `.env.local` diisi dengan benar
- [ ] Migration 00001-00004 dijalankan & diverifikasi
- [ ] Seed data dimasukkan
- [ ] Admin role di-set untuk user pertama
- [ ] `npm run build` passing lokal
- [ ] App di-push ke GitHub
- [ ] Vercel project di-setup dengan env variables
- [ ] Deploy pertama berhasil
- [ ] Supabase redirect URLs di-update
- [ ] Health check script dijalankan & passing
- [ ] Manual testing checklist dikerjakan
- [ ] CI/CD GitHub Actions di-setup (opsional)

---

**Selamat!** Injury Intelligence Platform sudah production-ready 🎉

*Dokumen ini di-generate otomatis. Update jika ada perubahan arsitektur.*
