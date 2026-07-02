-- Migration 00002: New Tables for Assessments, Appointments, Messages
-- ⚠️ ONLY run this after 00001_schema.sql has been applied
-- This file creates ONLY new tables, does NOT drop existing ones

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'fms',
  score NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "assessments_select"
  ON assessments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "assessments_insert"
  ON assessments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "assessments_update"
  ON assessments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "assessments_delete"
  ON assessments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
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

CREATE POLICY IF NOT EXISTS "appointments_select"
  ON appointments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "appointments_insert"
  ON appointments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "appointments_update"
  ON appointments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "appointments_delete"
  ON appointments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "messages_select"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY IF NOT EXISTS "messages_insert"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_assessments_athlete_id ON assessments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_appointments_athlete_id ON appointments(athlete_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- Trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointments
CREATE TRIGGER IF NOT EXISTS update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
