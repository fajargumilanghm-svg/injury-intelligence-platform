# Full Feature Pages — Implementation Plan (3 Sub-Projects)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 5 missing dashboard pages with full CRUD: assessments, appointments, messages, admin, settings.

**Architecture:** 3 independent sub-projects executed sequentially (C → B → A). Each produces working, testable software on its own.

**Tech Stack:** Next.js 16, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Prisma

## Global Constraints

- All pages follow existing dashboard layout pattern
- All pages use `useAuth()` for auth checks
- All query functions use `handleData`/`handleSingle`/`handleError` from helpers.ts
- No new npm packages
- Build must pass after each sub-project

---

## Sub-Project C: Admin + Settings (No New Tables)

### Task C1: Admin Page — User Management

**Files:**
- Create: `src/app/dashboard/admin/page.tsx`
- Create: `src/lib/supabase/admin.ts`

**Interfaces:**
- Consumes: `UserProfile` type, `getAllUsers()`, `updateUserRole()`
- Produces: Admin dashboard showing all users with role management

- [ ] **Step 1: Create admin.ts lib**

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getAllUsers(): Promise<UserProfile[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return handleData<UserProfile>(data, error, "admin.get-all-users");
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("id", userId);
  handleError(error, "admin.update-role");
}
```

- [ ] **Step 2: Create admin page**

Table layout showing all users (full_name, email, role, created_at). Role dropdown for editing. Admin-only access (check role === "administrator").

- [ ] **Step 3: Build + Commit**

```bash
git add src/lib/supabase/admin.ts src/app/dashboard/admin/page.tsx
git commit -m "feat: admin page with user management"
```

### Task C2: Settings Page — Profile Edit

**Files:**
- Create: `src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `updateProfile()` from auth-context
- Produces: Settings form for editing own profile

- [ ] **Step 1: Create settings page**

Form with fields: full_name, avatar_url. Submit calls auth-context `updateProfile()` or direct Supabase update. Show success toast.

- [ ] **Step 2: Build + Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: settings page for profile editing"
```

---

## Sub-Project B: Assessments (1 New Table)

### Task B0: Add TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: None
- Produces: Assessment interface

- [ ] **Step 1: Add Assessment type**

```typescript
export interface Assessment {
  id: string;
  athlete_id: string;
  assessment_date: string;
  type: string;
  score: number;
  notes: string | null;
  created_at: string;
}
```

### Task B1: Database Migration

**Files:**
- Modify: `prisma/schema.prisma` — add Assessment model
- Modify: `supabase/migrations/00001_schema.sql` — add assessments table

**Interfaces:**
- Consumes: existing schema
- Produces: assessments table in DB + Prisma model

- [ ] **Step 1: Add assessments table to SQL migration**

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

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assessments_select"
  ON assessments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "assessments_insert"
  ON assessments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "assessments_update"
  ON assessments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "assessments_delete"
  ON assessments FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_assessments_athlete_id ON assessments(athlete_id);
```

- [ ] **Step 2: Add Assessment model to Prisma schema**

```prisma
model Assessment {
  id              String   @id @default(uuid())
  athleteId       String   @map("athlete_id")
  assessmentDate  DateTime @map("assessment_date") @db.Date
  type            String
  score           Decimal
  notes           String?
  createdAt       DateTime @default(now()) @map("created_at")

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  @@map("assessments")
}
```

- [ ] **Step 3: Run prisma validate + Commit**

```bash
npx prisma validate
git add prisma/schema.prisma supabase/migrations/00001_schema.sql
git commit -m "feat: add assessments table to schema"
```

### Task B2: Assessments Lib + Page

**Files:**
- Create: `src/lib/supabase/assessments.ts`
- Create: `src/app/dashboard/assessments/page.tsx`

**Interfaces:**
- Consumes: Assessment type, athleteId
- Produces: CRUD operations + list page

- [ ] **Step 1: Create assessments.ts lib**

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import type { Assessment } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getAssessments(athleteId: string): Promise<Assessment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("assessment_date", { ascending: false });
  return handleData<Assessment>(data, error, "assessments.get-all");
}

export async function createAssessment(
  athleteId: string,
  values: Omit<Assessment, "id" | "created_at" | "athlete_id">
): Promise<Assessment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .insert({ ...values, athlete_id: athleteId })
    .select()
    .single();
  return handleSingle<Assessment>(data, error, "assessments.create");
}

export async function updateAssessment(
  id: string,
  values: Partial<Omit<Assessment, "id" | "created_at" | "athlete_id">>
): Promise<Assessment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assessments")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  return handleSingle<Assessment>(data, error, "assessments.update");
}

export async function deleteAssessment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  handleError(error, "assessments.delete");
}
```

- [ ] **Step 2: Create assessments page**

Table showing assessments (date, type, score, notes). Add/Edit/Delete buttons. Form with type select, score input, notes textarea, date picker.

- [ ] **Step 3: Build + Commit**

```bash
git add src/lib/supabase/assessments.ts src/app/dashboard/assessments/page.tsx
git commit -m "feat: assessments page with full CRUD"
```

---

## Sub-Project A: Appointments + Messages (2 New Tables)

### Task A0: Add TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: None
- Produces: Appointment + Message interfaces

- [ ] **Step 1: Add Appointment and Message types**

```typescript
export interface Appointment {
  id: string;
  athlete_id: string;
  provider_id: string;
  appointment_date: string;
  type: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}
```

### Task A1: Database Migration

**Files:**
- Modify: `prisma/schema.prisma` — add Appointment + Message models
- Modify: `supabase/migrations/00001_schema.sql` — add appointments + messages tables

**Interfaces:**
- Consumes: existing schema
- Produces: appointments + messages tables in DB + Prisma models

- [ ] **Step 1: Add appointments + messages tables to SQL**

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

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select"
  ON appointments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "appointments_insert"
  ON appointments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "appointments_update"
  ON appointments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "appointments_delete"
  ON appointments FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_appointments_athlete_id ON appointments(athlete_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
```

- [ ] **Step 2: Add Appointment + Message models to Prisma**

```prisma
model Appointment {
  id              String   @id @default(uuid())
  athleteId       String   @map("athlete_id")
  providerId      String   @map("provider_id")
  appointmentDate DateTime @map("appointment_date")
  type            String
  status          String
  notes           String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  athlete Athlete @relation(fields: [athleteId], references: [id], onDelete: Cascade)

  @@map("appointments")
}

model Message {
  id         String   @id @default(uuid())
  senderId   String   @map("sender_id")
  receiverId String   @map("receiver_id")
  content    String
  read       Boolean  @default(false)
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("messages")
}
```

- [ ] **Step 3: Validate + Commit**

```bash
npx prisma validate
git add prisma/schema.prisma supabase/migrations/00001_schema.sql
git commit -m "feat: add appointments and messages tables"
```

### Task A2: Appointments Lib + Page

**Files:**
- Create: `src/lib/supabase/appointments.ts`
- Create: `src/app/dashboard/appointments/page.tsx`

**Interfaces:**
- Consumes: Appointment type, athleteId, providerId
- Produces: CRUD + calendar/table view

- [ ] **Step 1: Create appointments.ts lib**

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import type { Appointment } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getAppointments(athleteId: string): Promise<Appointment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("appointment_date", { ascending: true });
  return handleData<Appointment>(data, error, "appointments.get-all");
}

export async function createAppointment(
  values: Omit<Appointment, "id" | "created_at" | "updated_at">
): Promise<Appointment | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert(values)
    .select()
    .single();
  return handleSingle<Appointment>(data, error, "appointments.create");
}

export async function updateAppointmentStatus(id: string, status: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  handleError(error, "appointments.update-status");
}

export async function cancelAppointment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  handleError(error, "appointments.cancel");
}
```

- [ ] **Step 2: Create appointments page**

Table view: date, type, status, notes. Status badge colors. Add appointment button (modal form with date-time picker, type select, notes). Cancel action for scheduled appointments.

- [ ] **Step 3: Build + Commit**

```bash
git add src/lib/supabase/appointments.ts src/app/dashboard/appointments/page.tsx
git commit -m "feat: appointments page with CRUD"
```

### Task A3: Messages Lib + Page

**Files:**
- Create: `src/lib/supabase/messages.ts`
- Create: `src/app/dashboard/messages/page.tsx`

**Interfaces:**
- Consumes: Message type, senderId, receiverId
- Produces: Conversations list + chat view

- [ ] **Step 1: Create messages.ts lib**

```typescript
"use client";

import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types";
import { handleData, handleSingle, handleError } from "./helpers";

export async function getConversations(userId: string): Promise<{ partner_id: string; partner_name: string; unread_count: number; last_message: string; last_at: string }[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("get_conversations", { user_id: userId });
  return handleData(data, error, "messages.get-conversations");
}

export async function getMessages(userId: string, partnerId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
    .order("created_at", { ascending: true });
  return handleData<Message>(data, error, "messages.get-messages");
}

export async function sendMessage(
  senderId: string,
  receiverId: string,
  content: string
): Promise<Message | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select()
    .single();
  return handleSingle<Message>(data, error, "messages.send");
}

export async function markMessagesRead(receiverId: string, senderId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("messages")
    .update({ read: true })
    .eq("receiver_id", receiverId)
    .eq("sender_id", senderId)
    .eq("read", false);
  handleError(error, "messages.mark-read");
}
```

Note: `getConversations` uses a Supabase RPC function. If RPC is not available, implement client-side grouping.

- [ ] **Step 2: Create messages page**

Two-panel layout: left sidebar = conversation list (partner name, last message preview, unread badge), right panel = chat view (messages list + input form). Simple UI without real-time WebSocket (use polling or manual refresh).

- [ ] **Step 3: Build + Commit**

```bash
git add src/lib/supabase/messages.ts src/app/dashboard/messages/page.tsx
git commit -m "feat: messages page with conversations and chat"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All 5 pages and 3 new tables covered
- [ ] **Placeholder scan:** No TBD, TODO, or vague steps
- [ ] **Type consistency:** All types (Assessment, Appointment, Message) defined in types/index.ts
