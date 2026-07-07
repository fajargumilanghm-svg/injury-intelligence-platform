-- ============================================================================
-- SEED DATA v3 Final — Multi-User with 2 Real Users + Athlete Placeholder
-- ============================================================================
-- 
-- INSTRUKSI:
-- 1. Jalankan SELURUH script ini di Supabase SQL Editor
-- 2. Setelah selesai, buat athlete user via Supabase Dashboard → Auth → Add User
-- 3. Copy UUID athlete yang baru dibuat
-- 4. Jalankan bagian "STEP 8: Link Athlete Data" di bawah
--
-- UUIDs yang sudah terdaftar:
--   Admin:  e9a28b48-7b00-4277-be17-3a8cdf3ddb4e
--   Coach:  64a54eee-2d4d-4c3a-8e84-29f48d46ade6
--   Athlete: 8eefdf93-694f-4929-bd7f-5429305a5736 (placeholder)
--
-- ============================================================================

DO $$
DECLARE
  v_admin_uuid   UUID := 'e9a28b48-7b00-4277-be17-3a8cdf3ddb4e';
  v_admin_email  TEXT := 'admin@injuryintel.com';
  v_admin_name   TEXT := 'Dr. Admin';

  v_coach_uuid   UUID := '64a54eee-2d4d-4c3a-8e84-29f48d46ade6';
  v_coach_email  TEXT := 'coach@injuryintel.com';
  v_coach_name   TEXT := 'Head Coach';

  -- Athlete placeholder UUID — akan diganti di Step 8
  v_athlete_uuid UUID := '8eefdf93-694f-4929-bd7f-5429305a5736';
  v_athlete_email TEXT := 'athlete@injuryintel.com';
  v_athlete_name  TEXT := 'Player One';
BEGIN

  -- ─── Step 1: Create User Profiles ─────────────────────────────────────
  
  -- Admin (administrator)
  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_admin_uuid, v_admin_email, v_admin_name, 'administrator', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'administrator',
    full_name = v_admin_name,
    updated_at = NOW();
  RAISE NOTICE '✅ Admin profile: %', v_admin_email;

  -- Coach
  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_coach_uuid, v_coach_email, v_coach_name, 'coach', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    role = 'coach',
    full_name = v_coach_name,
    updated_at = NOW();
  RAISE NOTICE '✅ Coach profile: %', v_coach_email;

  -- Athlete (placeholder — akan di-update setelah create di auth.users)
  -- Note: This will FAIL if athlete user doesn't exist in auth.users yet
  -- If it fails, skip this and run it after creating user via Dashboard
  BEGIN
    INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
    VALUES (v_athlete_uuid, v_athlete_email, v_athlete_name, 'athlete', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      role = 'athlete',
      full_name = v_athlete_name,
      updated_at = NOW();
    RAISE NOTICE '✅ Athlete profile: %', v_athlete_email;
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE '⚠️ Athlete user not in auth.users yet. Run Step 8 after creating user via Dashboard.';
  END;

  -- ─── Step 2: Create Athletes ─────────────────────────────────────────
  
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

  -- Athlete's own profile (linked to placeholder UUID initially)
  INSERT INTO athletes (user_id, full_name, age, gender, height, weight, sport, playing_position, dominant_side, training_experience, previous_injury_history) VALUES
    (v_athlete_uuid, 'Chris Taylor', 28, 'male', 188, 85, 'American Football', 'Quarterback', 'right', 'advanced', 'ACL reconstruction left knee (2021)');

  RAISE NOTICE '✅ Athletes created: Admin=5, Coach=3, Athlete=1';

  -- ─── Step 3: Injuries ────────────────────────────────────────────────
  
  INSERT INTO injuries (athlete_id, injury_date, injury_type, body_part, severity, mechanism, side, diagnosis, status, estimated_recovery_days, treatment_notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), '2024-01-15', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'right', 'Complete ACL rupture', 'recovered', 270, 'Surgical reconstruction with hamstring autograft'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), '2024-03-10', 'Ankle Sprain', 'Ankle', 'moderate', 'contact', 'left', 'Grade 2 ATFL tear', 'recovered', 42, 'RICE protocol and progressive rehabilitation'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), '2024-06-20', 'Concussion', 'Head', 'moderate', 'contact', 'n/a', 'Grade 2 concussion', 'recovered', 14, 'Cognitive rest and graduated return-to-play'),
    ((SELECT id FROM athletes WHERE full_name = 'David Brown' AND user_id = v_admin_uuid LIMIT 1), '2024-02-01', 'Shoulder Dislocation', 'Shoulder', 'severe', 'contact', 'right', 'Anterior shoulder dislocation with labral tear', 'recovering', 180, 'Arthroscopic labral repair'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), '2024-08-05', 'Hamstring Strain', 'Hamstring', 'minor', 'non_contact', 'right', 'Grade 1 hamstring strain', 'recovered', 14, 'Active rest and progressive hamstring loading'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), '2024-04-01', 'Stress Fracture', 'Foot', 'moderate', 'overuse', 'right', 'Navicular stress fracture', 'recovering', 84, 'Non-weight bearing 6 weeks followed by gradual return'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), '2024-01-20', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'left', 'Complete ACL rupture with meniscal tear', 'recovered', 300, 'Patellar tendon autograft reconstruction');

  RAISE NOTICE '✅ Injuries created';

  -- ─── Step 4: Training Entries ────────────────────────────────────────
  
  INSERT INTO training_entries (athlete_id, training_date, training_type, duration_minutes, intensity_rpe, load_score, notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body focus'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 45, 6, 270, 'Interval running'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'sport_specific', 90, 8, 720, 'Team training'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 50, 6, 300, 'Full body'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 40, 7, 280, 'Conditioning'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 75, 8, 600, 'Heavy lifting'),
    ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 90, 7, 630, 'Team practice'),
    ((SELECT id FROM athletes WHERE full_name = 'David Brown' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'cardio', 50, 7, 350, 'Team run'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 80, 7, 560, 'Match practice'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'recovery', 30, 2, 60, 'Active recovery'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 45, 5, 225, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Lisa Anderson' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'cardio', 60, 6, 360, 'Endurance run'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'flexibility', 40, 3, 120, 'Recovery session'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'cardio', 50, 7, 350, 'Conditioning');

  RAISE NOTICE '✅ Training entries created';

  -- ─── Step 5: Wellness Entries ────────────────────────────────────────
  
  INSERT INTO wellness_entries (athlete_id, sleep_quality, fatigue, muscle_soreness, stress_level, mood_state, recovery_feeling, wellness_score, submitted_at) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), 7, 5, 6, 4, 7, 6, 68, CURRENT_DATE - INTERVAL '2 days'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), 9, 3, 3, 2, 9, 9, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), 6, 6, 7, 5, 6, 5, 58, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' AND user_id = v_admin_uuid LIMIT 1), 8, 4, 4, 3, 8, 7, 60, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'David Brown' AND user_id = v_admin_uuid LIMIT 1), 7, 5, 6, 4, 7, 6, 50, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 63, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), 6, 6, 5, 5, 6, 5, 52, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Lisa Anderson' AND user_id = v_coach_uuid LIMIT 1), 7, 5, 4, 4, 7, 6, 55, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), 7, 5, 4, 4, 7, 7, 73, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), 6, 6, 5, 5, 6, 6, 68, CURRENT_DATE - INTERVAL '2 days');

  RAISE NOTICE '✅ Wellness entries created';

  -- ─── Step 6: Notifications ──────────────────────────────────────────
  
  INSERT INTO notifications (user_id, title, message, type, read, created_at) VALUES
    (v_admin_uuid, 'Welcome Admin', 'Full platform access granted. You can manage all athletes and users.', 'success', false, NOW()),
    (v_admin_uuid, 'System Ready', 'All migrations completed successfully.', 'info', false, NOW() - INTERVAL '1 hour'),
    (v_coach_uuid, 'Welcome Coach', 'Team dashboard is ready. You have 3 athletes assigned.', 'success', false, NOW()),
    (v_coach_uuid, 'Training Alert', 'Emma Davis has elevated ACWR. Monitor closely.', 'warning', false, NOW() - INTERVAL '2 hours'),
    (v_athlete_uuid, 'Welcome Athlete', 'Complete your profile and first wellness check.', 'info', false, NOW()),
    (v_athlete_uuid, 'Recovery Tip', 'Remember to log your daily wellness metrics.', 'info', true, NOW() - INTERVAL '1 day');

  RAISE NOTICE '✅ Notifications created';

  -- ─── Step 7: Summary ─────────────────────────────────────────────────
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED COMPLETE!';
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
  RAISE NOTICE '⚠️ IMPORTANT: If athlete user not in auth.users yet,';
  RAISE NOTICE '   create via Dashboard → Auth → Add User (email: athlete@injuryintel.com)';
  RAISE NOTICE '   Then run Step 8 below to link data.';
  RAISE NOTICE '========================================';

END $$;

-- ─── Step 8: Link Athlete Data (Run AFTER creating athlete user) ──────
-- 
-- INSTRUKSI:
-- 1. Buka Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" 
-- 3. Email: athlete@injuryintel.com
-- 4. Password: Athlete123!@#
-- 5. Simpan UUID yang muncul (misal: NEW_UUID_HERE)
-- 6. Ganti 'NEW_UUID_HERE' di bawah dengan UUID tersebut
-- 7. Jalankan query ini

/*
DO $$
DECLARE
  old_uuid UUID := '8eefdf93-694f-4929-bd7f-5429305a5736';  -- placeholder
  new_uuid UUID := 'NEW_UUID_HERE';  -- ← GANTI DENGAN UUID BARU
BEGIN
  -- Update athletes ownership
  UPDATE athletes SET user_id = new_uuid WHERE user_id = old_uuid;
  
  -- Update user_profiles
  UPDATE user_profiles SET user_id = new_uuid WHERE user_id = old_uuid;
  
  -- Update notifications
  UPDATE notifications SET user_id = new_uuid WHERE user_id = old_uuid;
  
  RAISE NOTICE '✅ Athlete data linked to new UUID: %', new_uuid;
END $$;
*/

-- ─── Verification Query ──────────────────────────────────────────────
SELECT 
  up.role,
  up.full_name as user_name,
  COUNT(DISTINCT a.id) as athletes,
  COUNT(DISTINCT i.id) as injuries,
  COUNT(DISTINCT t.id) as training,
  COUNT(DISTINCT w.id) as wellness,
  COUNT(DISTINCT n.id) as notifications
FROM user_profiles up
LEFT JOIN athletes a ON a.user_id = up.user_id
LEFT JOIN injuries i ON i.athlete_id = a.id
LEFT JOIN training_entries t ON t.athlete_id = a.id
LEFT JOIN wellness_entries w ON w.athlete_id = a.id
LEFT JOIN notifications n ON n.user_id = up.user_id
WHERE up.role IN ('administrator', 'coach', 'athlete')
GROUP BY up.role, up.full_name, up.user_id
ORDER BY CASE up.role WHEN 'administrator' THEN 1 WHEN 'coach' THEN 2 ELSE 3 END;
