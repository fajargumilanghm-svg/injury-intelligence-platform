# Full Feature Pages — Injury Intelligence Platform

> **Date:** 2026-06-30
> **Scope:** 5 missing pages with full CRUD (assessments, appointments, messages, admin, settings)
> **Decomposition:** 3 sub-projects (A: appointments+messages, B: assessments, C: admin+settings)

---

## Sub-Project A: Appointments + Messages

### New Database Tables

**appointments**
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'consultation',
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**messages**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pages
- `/dashboard/appointments` — List appointments (calendar view + table), create, cancel
- `/dashboard/messages` — Inbox (conversations list), chat view, send message

### Data Layer
- `src/lib/supabase/appointments.ts` — getAppointments, createAppointment, updateStatus, cancelAppointment
- `src/lib/supabase/messages.ts` — getConversations, getMessages, sendMessage, markRead

---

## Sub-Project B: Assessments

### New Database Table

**assessments**
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'fms',
  score NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pages
- `/dashboard/assessments` — List assessments per athlete, create, edit, delete

### Data Layer
- `src/lib/supabase/assessments.ts` — getAssessments, createAssessment, updateAssessment, deleteAssessment

---

## Sub-Project C: Admin + Settings

### No New Tables
Uses existing:
- `user_profiles` for user listing and role management
- `auth.users` for admin operations

### Pages
- `/dashboard/admin` — User management table (list all users, view roles, edit role assignment)
- `/dashboard/settings` — Edit own profile (full_name, avatar, password change via Supabase auth)

### Data Layer
- `src/lib/supabase/admin.ts` — getAllUsers, updateUserRole
- Reuse existing `src/context/auth-context.tsx` for profile update

---

## Global Constraints

- All pages follow existing dashboard layout pattern (sidebar + top nav)
- All pages use `useAuth()` for athleteId + role checks
- All query functions use `handleData`/`handleSingle`/`handleError` from helpers.ts
- No new npm packages (use existing shadcn/ui, lucide-react, recharts)
- All pages include error boundary fallback (now exists in dashboard/error.tsx)

## Build & Test
- `npm run build` after each sub-project
- `npx prisma validate` after schema changes

## Rollback
Each sub-project is independent. Can be merged/deployed separately.
