-- Migration 00004: RLS Security Hardening for Core Data Tables
-- Hardens overly permissive policies on athletes, injuries, training_entries,
-- wellness_entries, physical_screenings, recovery_milestones, and rtp_phases.
-- Run this AFTER 00003_rls_fix.sql

-- ============================================================
-- ATHLETES: Scoped RLS
-- Athletes: view/edit their own profile
-- Staff/Admin: all athletes
-- ============================================================

DROP POLICY IF EXISTS "athletes_select" ON athletes;
DROP POLICY IF EXISTS "athletes_insert" ON athletes;
DROP POLICY IF EXISTS "athletes_update" ON athletes;
DROP POLICY IF EXISTS "athletes_delete" ON athletes;

CREATE POLICY "athletes_select_scoped"
  ON athletes FOR SELECT
  USING (
    auth.uid() = user_id
    OR is_staff_or_admin()
  );

CREATE POLICY "athletes_insert_scoped"
  ON athletes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR is_staff_or_admin()
  );

CREATE POLICY "athletes_update_scoped"
  ON athletes FOR UPDATE
  USING (
    auth.uid() = user_id
    OR is_staff_or_admin()
  );

CREATE POLICY "athletes_delete_scoped"
  ON athletes FOR DELETE
  USING (is_staff_or_admin());

-- ============================================================
-- INJURIES: Scoped RLS
-- Athletes: only their own injuries (via athletes.user_id)
-- Staff/Admin: all injuries
-- ============================================================

DROP POLICY IF EXISTS "injuries_select" ON injuries;
DROP POLICY IF EXISTS "injuries_insert" ON injuries;
DROP POLICY IF EXISTS "injuries_update" ON injuries;
DROP POLICY IF EXISTS "injuries_delete" ON injuries;

CREATE POLICY "injuries_select_scoped"
  ON injuries FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "injuries_insert_scoped"
  ON injuries FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "injuries_update_scoped"
  ON injuries FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "injuries_delete_scoped"
  ON injuries FOR DELETE
  USING (is_staff_or_admin());

-- ============================================================
-- RECOVERY MILESTONES: Scoped via injury -> athlete
-- ============================================================

DROP POLICY IF EXISTS "milestones_select" ON recovery_milestones;
DROP POLICY IF EXISTS "milestones_insert" ON recovery_milestones;
DROP POLICY IF EXISTS "milestones_update" ON recovery_milestones;
DROP POLICY IF EXISTS "milestones_delete" ON recovery_milestones;

CREATE POLICY "milestones_select_scoped"
  ON recovery_milestones FOR SELECT
  USING (
    auth.uid() IN (
      SELECT a.user_id FROM injuries i
      JOIN athletes a ON a.id = i.athlete_id
      WHERE i.id = injury_id
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "milestones_insert_scoped"
  ON recovery_milestones FOR INSERT
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "milestones_update_scoped"
  ON recovery_milestones FOR UPDATE
  USING (is_staff_or_admin());

CREATE POLICY "milestones_delete_scoped"
  ON recovery_milestones FOR DELETE
  USING (is_staff_or_admin());

-- ============================================================
-- RTP PHASES: Scoped via injury -> athlete
-- ============================================================

DROP POLICY IF EXISTS "rtp_select" ON rtp_phases;
DROP POLICY IF EXISTS "rtp_insert" ON rtp_phases;
DROP POLICY IF EXISTS "rtp_update" ON rtp_phases;
DROP POLICY IF EXISTS "rtp_delete" ON rtp_phases;

CREATE POLICY "rtp_select_scoped"
  ON rtp_phases FOR SELECT
  USING (
    auth.uid() IN (
      SELECT a.user_id FROM injuries i
      JOIN athletes a ON a.id = i.athlete_id
      WHERE i.id = injury_id
    )
    OR is_staff_or_admin()
  );

CREATE POLICY "rtp_insert_scoped"
  ON rtp_phases FOR INSERT
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "rtp_update_scoped"
  ON rtp_phases FOR UPDATE
  USING (is_staff_or_admin());

CREATE POLICY "rtp_delete_scoped"
  ON rtp_phases FOR DELETE
  USING (is_staff_or_admin());

-- ============================================================
-- TRAINING ENTRIES: Scoped RLS
-- Athletes: only their own entries
-- Staff/Admin: all entries
-- ============================================================

DROP POLICY IF EXISTS "training_select" ON training_entries;
DROP POLICY IF EXISTS "training_insert" ON training_entries;
DROP POLICY IF EXISTS "training_update" ON training_entries;
DROP POLICY IF EXISTS "training_delete" ON training_entries;

CREATE POLICY "training_select_scoped"
  ON training_entries FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "training_insert_scoped"
  ON training_entries FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "training_update_scoped"
  ON training_entries FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "training_delete_scoped"
  ON training_entries FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

-- ============================================================
-- WELLNESS ENTRIES: Scoped RLS
-- Athletes: only their own entries
-- Staff/Admin: all entries
-- ============================================================

DROP POLICY IF EXISTS "wellness_select" ON wellness_entries;
DROP POLICY IF EXISTS "wellness_insert" ON wellness_entries;
DROP POLICY IF EXISTS "wellness_update" ON wellness_entries;
DROP POLICY IF EXISTS "wellness_delete" ON wellness_entries;

CREATE POLICY "wellness_select_scoped"
  ON wellness_entries FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "wellness_insert_scoped"
  ON wellness_entries FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "wellness_update_scoped"
  ON wellness_entries FOR UPDATE
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "wellness_delete_scoped"
  ON wellness_entries FOR DELETE
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

-- ============================================================
-- PHYSICAL SCREENINGS: Scoped RLS
-- Athletes: only their own screenings
-- Staff/Admin: all screenings
-- ============================================================

DROP POLICY IF EXISTS "screenings_select" ON physical_screenings;
DROP POLICY IF EXISTS "screenings_insert" ON physical_screenings;
DROP POLICY IF EXISTS "screenings_update" ON physical_screenings;
DROP POLICY IF EXISTS "screenings_delete" ON physical_screenings;

CREATE POLICY "screenings_select_scoped"
  ON physical_screenings FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM athletes WHERE id = athlete_id)
    OR is_staff_or_admin()
  );

CREATE POLICY "screenings_insert_scoped"
  ON physical_screenings FOR INSERT
  WITH CHECK (is_staff_or_admin());

CREATE POLICY "screenings_update_scoped"
  ON physical_screenings FOR UPDATE
  USING (is_staff_or_admin());

CREATE POLICY "screenings_delete_scoped"
  ON physical_screenings FOR DELETE
  USING (is_staff_or_admin());
