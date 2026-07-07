-- ============================================================================
-- SEED DATA v3 — Multi-User Setup (Admin + Coach + Athlete)
-- ============================================================================
-- 
-- INSTRUKSI:
-- 1. Buat 3 user via /auth/register atau Supabase Dashboard
-- 2. Dapatkan UUID masing-masing:
--    - Admin: Dashboard → Auth → Users → copy UUID
--    - Coach: Dashboard → Auth → Users → copy UUID
--    - Athlete: Dashboard → Auth → Users → copy UUID
-- 3. Ganti placeholder di bawah
-- 4. Jalankan di Supabase SQL Editor
--
-- HASIL: 3 user dengan role berbeda, data terpisah, siap testing RLS
-- ============================================================================

-- ─── Konfigurasi UUID (GANTI SEMUA INI!) ──────────────────────────────────

DO $$
DECLARE
  v_admin_uuid  UUID := 'ADMIN_UUID_HERE';   -- ← GANTI: User 1 (Admin)
  v_admin_email TEXT := 'admin@injuryintel.com';
  v_admin_name  TEXT := 'Dr. Admin';

  v_coach_uuid  UUID := 'COACH_UUID_HERE';     -- ← GANTI: User 2 (Coach)
  v_coach_email TEXT := 'coach@injuryintel.com';
  v_coach_name  TEXT := 'Head Coach';

  v_athlete_uuid  UUID := 'ATHLETE_UUID_HERE'; -- ← GANTI: User 3 (Athlete)
  v_athlete_email TEXT := 'athlete@injuryintel.com';
  v_athlete_name  TEXT := 'Player One';
BEGIN

  -- ─── Step 1: Create User Profiles with Roles ───────────────────────────
  
  -- Admin
  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_admin_uuid, v_admin_email, v_admin_name, 'administrator', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'administrator',
    full_name = v_admin_name,
    updated_at = NOW();
  RAISE NOTICE 'Admin profile created: %', v_admin_email;

  -- Coach
  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_coach_uuid, v_coach_email, v_coach_name, 'coach', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'coach',
    full_name = v_coach_name,
    updated_at = NOW();
  RAISE NOTICE 'Coach profile created: %', v_coach_email;

  -- Athlete
  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_athlete_uuid, v_athlete_email, v_athlete_name, 'athlete', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'athlete',
    full_name = v_athlete_name,
    updated_at = NOW();
  RAISE NOTICE 'Athlete profile created: %', v_athlete_email;

  -- ─── Step 2: Create Athletes (linked to respective users) ────────────
  
  -- Admin's athletes (5 athletes)
  INSERT INTO athletes (user_id, full_name, age, gender, height, weight, sport, playing_position, dominant_side, training_experience, previous_injury_history) VALUES
    (v_admin_uuid, 'Alex Johnson', 24, 'male', 185, 82, 'Soccer', 'Forward', 'right', 'advanced', 'ACL reconstruction right knee (2022)'),
    (v_admin_uuid, 'Maria Garcia', 26, 'female', 170, 65, 'Basketball', 'Point Guard', 'right', 'advanced', 'Ankle sprain left (2023)'),
    (v_admin_uuid, 'James Smith', 22, 'male', 190, 88, 'American Football', 'Linebacker', 'left', 'intermediate', 'Concussion (2023)'),
    (v_admin_uuid, 'Sarah Williams', 23, 'female', 168, 60, 'Volleyball', 'Outside Hitter', 'right', 'intermediate', NULL),
    (v_admin_uuid, 'David Brown', 27, 'male', 178, 75, 'Rugby', 'Flanker', 'ambidextrous', 'advanced', 'Shoulder dislocation right (2022)');

  -- Coach's athletes (3 athletes)
  INSERT INTO athletes (user_id, full_name, age, gender, height, weight, sport, playing_position, dominant_side, training_experience, previous_injury_history) VALUES
    (v_coach_uuid, 'Emma Davis', 21, 'female', 172, 63, 'Soccer', 'Midfielder', 'right', 'intermediate', 'Hamstring strain (2024)'),
    (v_coach_uuid, 'Michael Wilson', 25, 'male', 182, 80, 'Basketball', 'Small Forward', 'right', 'advanced', 'Stress fracture foot (2023)'),
    (v_coach_uuid, 'Lisa Anderson', 24, 'female', 175, 68, 'Soccer', 'Defender', 'left', 'intermediate', NULL);

  -- Athlete's own profile (1 athlete — dirinya sendiri)
  INSERT INTO athletes (user_id, full_name, age, gender, height, weight, sport, playing_position, dominant_side, training_experience, previous_injury_history) VALUES
    (v_athlete_uuid, 'Chris Taylor', 28, 'male', 188, 85, 'American Football', 'Quarterback', 'right', 'advanced', 'ACL reconstruction left knee (2021)');

  RAISE NOTICE 'Athletes created: Admin=5, Coach=3, Athlete=1';

  -- ─── Step 3: Injuries per User ─────────────────────────────────────────
  
  -- Admin's athletes injuries
  INSERT INTO injuries (athlete_id, injury_date, injury_type, body_part, severity, mechanism, side, diagnosis, status, estimated_recovery_days, actual_recovery_days, expected_return_date, actual_return_date, return_to_play_date, treatment_notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), '2024-01-15', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'right', 'Complete ACL rupture', 'recovered', 270, 285, '2024-10-15', '2024-10-28', '2024-11-15', 'Surgical reconstruction with hamstring autograft'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), '2024-03-10', 'Ankle Sprain', 'Ankle', 'moderate', 'contact', 'left', 'Grade 2 ATFL tear', 'recovered', 42, 38, '2024-04-21', '2024-04-17', '2024-04-25', 'RICE protocol followed by progressive rehabilitation'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), '2024-06-20', 'Concussion', 'Head', 'moderate', 'contact', 'n/a', 'Grade 2 concussion', 'recovered', 14, 12, '2024-07-04', '2024-07-02', '2024-07-05', 'Cognitive rest followed by graduated return-to-play protocol'),
    ((SELECT id FROM athletes WHERE full_name = 'David Brown' AND user_id = v_admin_uuid LIMIT 1), '2024-02-01', 'Shoulder Dislocation', 'Shoulder', 'severe', 'contact', 'right', 'Anterior shoulder dislocation with labral tear', 'recovering', 180, 195, '2024-07-30', '2024-08-15', '2024-09-01', 'Arthroscopic labral repair');

  -- Coach's athletes injuries
  INSERT INTO injuries (athlete_id, injury_date, injury_type, body_part, severity, mechanism, side, diagnosis, status, estimated_recovery_days, actual_recovery_days, expected_return_date, actual_return_date, return_to_play_date, treatment_notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), '2024-08-05', 'Hamstring Strain', 'Hamstring', 'minor', 'non_contact', 'right', 'Grade 1 hamstring strain', 'recovered', 14, 10, '2024-08-19', '2024-08-15', '2024-08-20', 'Active rest and progressive hamstring loading'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), '2024-04-01', 'Stress Fracture', 'Foot', 'moderate', 'overuse', 'right', 'Navicular stress fracture', 'recovering', 84, NULL, '2024-06-24', NULL, NULL, 'Non-weight bearing 6 weeks followed by gradual return');

  -- Athlete's own injury
  INSERT INTO injuries (athlete_id, injury_date, injury_type, body_part, severity, mechanism, side, diagnosis, status, estimated_recovery_days, actual_recovery_days, expected_return_date, actual_return_date, return_to_play_date, treatment_notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), '2024-01-20', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'left', 'Complete ACL rupture with meniscal tear', 'recovered', 300, 310, '2024-11-15', '2024-11-25', '2024-12-10', 'Patellar tendon autograft reconstruction');

  RAISE NOTICE 'Injuries created across all users';

  -- ─── Step 4: Training Entries per User ────────────────────────────────
  
  -- Admin's athletes training
  INSERT INTO training_entries (athlete_id, training_date, training_type, duration_minutes, intensity_rpe, load_score, notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body focus'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 45, 6, 270, 'Interval running'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'sport_specific', 90, 8, 720, 'Team training'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 50, 6, 300, 'Full body'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 40, 7, 280, 'Conditioning'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 75, 8, 600, 'Heavy lifting'),
    ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 90, 7, 630, 'Team practice'),
    ((SELECT id FROM athletes WHERE full_name = 'David Brown' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'cardio', 50, 7, 350, 'Team run');

  -- Coach's athletes training
  INSERT INTO training_entries (athlete_id, training_date, training_type, duration_minutes, intensity_rpe, load_score, notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 80, 7, 560, 'Match practice'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'recovery', 30, 2, 60, 'Active recovery'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 45, 5, 225, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Lisa Anderson' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'cardio', 60, 6, 360, 'Endurance run');

  -- Athlete's own training
  INSERT INTO training_entries (athlete_id, training_date, training_type, duration_minutes, intensity_rpe, load_score, notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'flexibility', 40, 3, 120, 'Recovery session'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'cardio', 50, 7, 350, 'Conditioning');

  RAISE NOTICE 'Training entries created across all users';

  -- ─── Step 5: Wellness Entries per User ─────────────────────────────────
  
  -- Admin's athletes wellness
  INSERT INTO wellness_entries (athlete_id, sleep_quality, fatigue, muscle_soreness, stress_level, mood_state, recovery_feeling, wellness_score, submitted_at) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), 7, 5, 6, 4, 7, 6, 68, CURRENT_DATE - INTERVAL '2 days'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), 9, 3, 3, 2, 9, 9, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), 6, 6, 7, 5, 6, 5, 58, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' AND user_id = v_admin_uuid LIMIT 1), 8, 4, 4, 3, 8, 7, 60, CURRENT_DATE - INTERVAL '1 day');

  -- Coach's athletes wellness
  INSERT INTO wellness_entries (athlete_id, sleep_quality, fatigue, muscle_soreness, stress_level, mood_state, recovery_feeling, wellness_score, submitted_at) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 63, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), 6, 6, 5, 5, 6, 5, 52, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Lisa Anderson' AND user_id = v_coach_uuid LIMIT 1), 7, 5, 4, 4, 7, 6, 55, CURRENT_DATE - INTERVAL '1 day');

  -- Athlete's own wellness
  INSERT INTO wellness_entries (athlete_id, sleep_quality, fatigue, muscle_soreness, stress_level, mood_state, recovery_feeling, wellness_score, submitted_at) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), 7, 5, 4, 4, 7, 7, 73, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), 6, 6, 5, 5, 6, 6, 68, CURRENT_DATE - INTERVAL '2 days');

  RAISE NOTICE 'Wellness entries created across all users';

  -- ─── Step 6: Notifications ──────────────────────────────────────────────
  
  INSERT INTO notifications (user_id, title, message, type, read, created_at) VALUES
    (v_admin_uuid, 'Welcome Admin', 'You have been assigned as administrator. Full access granted.', 'success', false, NOW()),
    (v_admin_uuid, 'System Alert', 'New athlete registration pending approval.', 'warning', false, NOW() - INTERVAL '1 hour'),
    (v_coach_uuid, 'Welcome Coach', 'Team dashboard is ready for your review.', 'success', false, NOW()),
    (v_coach_uuid, 'Training Reminder', 'Emma Davis missed yesterday session.', 'warning', false, NOW() - INTERVAL '2 hours'),
    (v_athlete_uuid, 'Welcome Athlete', 'Complete your profile and first wellness check.', 'info', false, NOW()),
    (v_athlete_uuid, 'Injury Risk Alert', 'Your ACWR is elevated. Consider rest day.', 'warning', true, NOW() - INTERVAL '1 day');

  RAISE NOTICE 'Notifications created';

  -- ─── Step 7: Summary ──────────────────────────────────────────────────
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MULTI-USER SEED COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users:';
  RAISE NOTICE '  Admin: % (%)', v_admin_name, v_admin_email;
  RAISE NOTICE '  Coach: % (%)', v_coach_name, v_coach_email;
  RAISE NOTICE '  Athlete: % (%)', v_athlete_name, v_athlete_email;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Data Summary:';
  RAISE NOTICE '  Athletes: %', (SELECT COUNT(*) FROM athletes);
  RAISE NOTICE '  Injuries: %', (SELECT COUNT(*) FROM injuries);
  RAISE NOTICE '  Training: %', (SELECT COUNT(*) FROM training_entries);
  RAISE NOTICE '  Wellness: %', (SELECT COUNT(*) FROM wellness_entries);
  RAISE NOTICE '  Notifications: %', (SELECT COUNT(*) FROM notifications);
  RAISE NOTICE '========================================';

END $$;

-- ─── Step 8: Verify Data Isolation ────────────────────────────────────────

SELECT 'VERIFICATION' as check_type;

-- Show data per user
SELECT 
  up.role,
  up.full_name as user_name,
  COUNT(DISTINCT a.id) as athlete_count,
  COUNT(DISTINCT i.id) as injury_count,
  COUNT(DISTINCT t.id) as training_count,
  COUNT(DISTINCT w.id) as wellness_count
FROM user_profiles up
LEFT JOIN athletes a ON a.user_id = up.user_id
LEFT JOIN injuries i ON i.athlete_id = a.id
LEFT JOIN training_entries t ON t.athlete_id = a.id
LEFT JOIN wellness_entries w ON w.athlete_id = a.id
WHERE up.role IN ('administrator', 'coach', 'athlete')
GROUP BY up.role, up.full_name, up.user_id
ORDER BY 
  CASE up.role 
    WHEN 'administrator' THEN 1 
    WHEN 'coach' THEN 2 
    WHEN 'athlete' THEN 3 
  END;
