# 🚀 Deployment Requirements — Injury Intelligence Platform

> **Complete checklist untuk deploy ke production**

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables (.env.local)

File ini **WAJIB** ada di root project. Copy dari `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Isi dengan nilai yang benar:

```env
# Supabase (WAJIB)
NEXT_PUBLIC_SUPABASE_URL=https://cuzmjkrgfcwlzldyzuqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1em1qa3JnZmN3bHpsZHl6dXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzY5MTAsImV4cCI6MjA5NjgxMjkxMH0.39I0M-x0FEHlX63YhCB0vyb1IarPtS8tDOK35cHj2vk
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Ambil dari Supabase Dashboard

# App (WAJIB)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app  # Untuk production

# Database (OPSIONAL — untuk Prisma)
DATABASE_URL=postgresql://postgres:[password]@db.cuzmjkrgfcwlzldyzuqv.supabase.co:5432/postgres

# Auth
NEXTAUTH_SECRET=random-string-here  # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

**Cara mendapatkan nilai:**
- **SUPABASE_SERVICE_ROLE_KEY**: Dashboard → Project Settings → API → `service_role key`
- **DATABASE_URL**: Dashboard → Settings → Database → Connection string
- **NEXT_PUBLIC_SITE_URL**: URL Vercel nanti (atau custom domain)

---

### 2. Supabase Database Setup

**Jalankan migration berurutan** di Supabase SQL Editor:

| Urutan | File | Status |
|--------|------|--------|
| 1 | `supabase/migrations/00001_schema.sql` | ⬜ |
| 2 | `supabase/migrations/00002_new_tables.sql` | ⬜ |
| 3 | `supabase/migrations/00003_rls_fix.sql` | ⬜ |
| 4 | `supabase/migrations/00004_rls_hardening.sql` | ⬜ |

**Verifikasi:**
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Harus ada 12+ tabel
```

---

### 3. Seed Data

**Pilih salah satu approach:**

**A. Single User (Cepat untuk testing):**
- Jalankan `supabase/seed_v2_with_user.sql`
- Ganti `YOUR_AUTH_USER_UUID` dengan UUID Anda

**B. Multi-User (Direkomendasikan untuk production):**
- 3 user: Admin + Coach + Athlete
- Login credentials sudah ada di seed_v3_ready.sql
- Jalankan di Supabase SQL Editor

**Verifikasi:**
```sql
SELECT COUNT(*) FROM athletes;      -- 9-10
SELECT COUNT(*) FROM injuries;       -- 7-8
SELECT COUNT(*) FROM training_entries; -- 20+
```

---

### 4. Auth Configuration

**Di Supabase Dashboard:**

1. **Authentication → URL Configuration:**
   ```
   Site URL: https://your-domain.vercel.app
   Redirect URLs:
     - http://localhost:3000/auth/callback
     - https://your-domain.vercel.app/auth/callback
   ```

2. **Email Templates** (opsional):
   - Konfirmasi email
   - Reset password
   - Magic link

3. **Providers** (opsional):
   - Google OAuth (jika ingin login dengan Google)
   - Email/Password (default, sudah aktif)

---

### 5. Local Testing

```bash
# Install dependencies
npm install

# Build production
npm run build
```

**Harus passing tanpa error!**

**Test manual:**
- [ ] Register → Login → Dashboard flow
- [ ] CRUD Training berjalan
- [ ] CRUD Wellness berjalan
- [ ] ACWR menampilkan data
- [ ] Export Excel berfungsi
- [ ] Dark mode toggle berfungsi

---

### 6. Git Push

```bash
git add -A
git commit -m "ready for production"
git push origin main
```

---

## 🚀 Deploy ke Vercel

### Langkah 1: Connect Repo

1. Buka [https://vercel.com](https://vercel.com)
2. Dashboard → **Add New...** → **Project**
3. Import repository GitHub Anda
4. Framework: **Next.js** (auto-detect)

### Langkah 2: Environment Variables

Tambahkan di Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://cuzmjkrgfcwlzldyzuqv.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production |

### Langkah 3: Deploy

Klik **Deploy** → tunggu ~3 menit.

### Langkah 4: Domain Setup

Vercel akan berikan domain gratis: `your-project.vercel.app`

Atau connect custom domain:
1. Vercel Dashboard → Project → Settings → Domains
2. Add custom domain
3. Update DNS records di registrar

---

## 🔒 Post-Deploy Security Checklist

- [ ] RLS policies aktif (cek via SQL query)
- [ ] Admin role di-set untuk user pertama
- [ ] Service Role Key tidak di-expose ke client
- [ ] Supabase redirect URL sudah update
- [ ] Email confirmation template sudah di-setup
- [ ] No sensitive data di public repo (.env.local di .gitignore)

---

## ✅ Quick Verification Commands

```bash
# Health check
npx tsx scripts/health-check.ts

# Build test
npm run build

# Type check
npx tsc --noEmit
```

---

## 🆘 Common Issues

**Build error: "Missing env var":**
→ Pastikan semua env variables di-set di Vercel Dashboard

**Auth callback error 400:**
→ Update redirect URLs di Supabase Dashboard → Auth → URL Configuration

**Data tidak muncul:**
→ Jalankan seed.sql atau cek migration 00004

**"violates row-level security policy":**
→ Cek athletes.user_id sudah terisi dan cocok dengan auth.users.id

---

## 📚 File Referensi

- `docs/DEPLOY.md` — Panduan deployment lengkap
- `scripts/health-check.ts` — Automated verification
- `supabase/seed_v3_ready.sql` — Multi-user seed data
- `.env.local` — Environment variables (jangan di-commit!)

---

**Status deployment Anda:** ⬜ Belum siap | 🟡 Sedang proses | ✅ Production ready
