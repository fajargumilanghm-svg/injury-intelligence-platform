-- Migration 00003: RLS Security Hardening
-- This tightens RLS policies for assessments and appointments
-- Run this AFTER 00002_new_tables.sql

-- ============================================================
-- HELPER FUNCTION: Check if current user has elevated privileges
-- ============================================================
CREATE OR REPLACE FUNCTION is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('coach', 'physiotherapist', 'sport_scientist', 'administrator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ASSESSMENTS: Scoped RLS
-- Athletes: only their own assessments
-- Staff/Admin: all assessments
-- ============================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "assessments_select" ON assessments;
DROP POLICY IF EXISTS "assessments_insert" ON assessments;
DROP POLICY IF EXISTS "assessments_update" ON assessments;
DROP POLICY IF EXISTS "assessments_delete" ON assessments;

-- SELECT: own assessments OR staff/admin
CREATE POLICY "assessments_select_scoped"
  ON assessments FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

-- INSERT: staff/admin only (athletes don't create their own assessments)
CREATE POLICY "assessments_insert_scoped"
  ON assessments FOR INSERT
  WITH CHECK (is_staff_or_admin());

-- UPDATE: staff/admin only
CREATE POLICY "assessments_update_scoped"
  ON assessments FOR UPDATE
  USING (is_staff_or_admin());

-- DELETE: staff/admin only
CREATE POLICY "assessments_delete_scoped"
  ON assessments FOR DELETE
  USING (is_staff_or_admin());

-- ============================================================
-- APPOINTMENTS: Scoped RLS
-- Athletes: only their own appointments
-- Provider (creator): their own appointments
-- Staff/Admin: all appointments
-- ============================================================

-- Drop old permissive policies
DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

-- SELECT: own appointments (as athlete) OR provider OR staff
CREATE POLICY "appointments_select_scoped"
  ON appointments FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR auth.uid() = provider_id
    OR is_staff_or_admin()
  );

-- INSERT: staff/admin or the assigned provider
CREATE POLICY "appointments_insert_scoped"
  ON appointments FOR INSERT
  WITH CHECK (
    auth.uid() = provider_id
    OR is_staff_or_admin()
  );

-- UPDATE: provider of the appointment OR staff/admin
CREATE POLICY "appointments_update_scoped"
  ON appointments FOR UPDATE
  USING (
    auth.uid() = provider_id
    OR is_staff_or_admin()
  );

-- DELETE: staff/admin only
CREATE POLICY "appointments_delete_scoped"
  ON appointments FOR DELETE
  USING (is_staff_or_admin());
