-- ============================================================================
-- AUTO-GENERATED Multi-User Seed (Final)
-- Admin: e9a28b48-7b00-4277-be17-3a8cdf3ddb4e
-- Coach: 64a54eee-2d4d-4c3a-8e84-29f48d46ade6
-- Athlete: 8eefdf93-694f-4929-bd7f-5429305a5736 (create via Dashboard if not exists)
-- ============================================================================

DO $$
DECLARE
  v_admin_uuid   UUID := 'e9a28b48-7b00-4277-be17-3a8cdf3ddb4e';
  v_coach_uuid   UUID := '64a54eee-2d4d-4c3a-8e84-29f48d46ade6';
  v_athlete_uuid UUID := '8eefdf93-694f-4929-bd7f-5429305a5736';
BEGIN

  -- User Profiles
  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_admin_uuid, 'admin@injuryintel.com', 'Dr. Admin', 'administrator', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET role = 'administrator', updated_at = NOW();

  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_coach_uuid, 'coach@injuryintel.com', 'Head Coach', 'coach', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET role = 'coach', updated_at = NOW();

  BEGIN
    INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
    VALUES (v_athlete_uuid, 'athlete@injuryintel.com', 'Player One', 'athlete', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET role = 'athlete', updated_at = NOW();
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'Athlete user not in auth.users yet';
  END;

  -- Athletes
  INSERT INTO athletes (user_id, full_name, age, gender, height, weight, sport, playing_position, dominant_side, training_experience, previous_injury_history) VALUES
    (v_admin_uuid, 'Alex Johnson', 24, 'male', 185, 82, 'Soccer', 'Forward', 'right', 'advanced', 'ACL reconstruction right knee (2022)'),
    (v_admin_uuid, 'Maria Garcia', 26, 'female', 170, 65, 'Basketball', 'Point Guard', 'right', 'advanced', 'Ankle sprain left (2023)'),
    (v_admin_uuid, 'James Smith', 22, 'male', 190, 88, 'American Football', 'Linebacker', 'left', 'intermediate', 'Concussion (2023)'),
    (v_admin_uuid, 'Sarah Williams', 23, 'female', 168, 60, 'Volleyball', 'Outside Hitter', 'right', 'intermediate', NULL),
    (v_admin_uuid, 'David Brown', 27, 'male', 178, 75, 'Rugby', 'Flanker', 'ambidextrous', 'advanced', 'Shoulder dislocation right (2022)'),
    (v_coach_uuid, 'Emma Davis', 21, 'female', 172, 63, 'Soccer', 'Midfielder', 'right', 'intermediate', 'Hamstring strain (2024)'),
    (v_coach_uuid, 'Michael Wilson', 25, 'male', 182, 80, 'Basketball', 'Small Forward', 'right', 'advanced', 'Stress fracture foot (2023)'),
    (v_coach_uuid, 'Lisa Anderson', 24, 'female', 175, 68, 'Soccer', 'Defender', 'left', 'intermediate', NULL),
    (v_athlete_uuid, 'Chris Taylor', 28, 'male', 188, 85, 'American Football', 'Quarterback', 'right', 'advanced', 'ACL reconstruction left knee (2021)');

  -- Injuries
  INSERT INTO injuries (athlete_id, injury_date, injury_type, body_part, severity, mechanism, side, diagnosis, status, estimated_recovery_days, treatment_notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), '2024-01-15', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'right', 'Complete ACL rupture', 'recovered', 270, 'Surgical reconstruction with hamstring autograft'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), '2024-03-10', 'Ankle Sprain', 'Ankle', 'moderate', 'contact', 'left', 'Grade 2 ATFL tear', 'recovered', 42, 'RICE protocol and progressive rehabilitation'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), '2024-06-20', 'Concussion', 'Head', 'moderate', 'contact', 'n/a', 'Grade 2 concussion', 'recovered', 14, 'Cognitive rest and graduated return-to-play'),
    ((SELECT id FROM athletes WHERE full_name = 'David Brown' AND user_id = v_admin_uuid LIMIT 1), '2024-02-01', 'Shoulder Dislocation', 'Shoulder', 'severe', 'contact', 'right', 'Anterior shoulder dislocation with labral tear', 'recovering', 180, 'Arthroscopic labral repair'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), '2024-08-05', 'Hamstring Strain', 'Hamstring', 'minor', 'non_contact', 'right', 'Grade 1 hamstring strain', 'recovered', 14, 'Active rest and progressive hamstring loading'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), '2024-04-01', 'Stress Fracture', 'Foot', 'moderate', 'overuse', 'right', 'Navicular stress fracture', 'recovering', 84, 'Non-weight bearing 6 weeks followed by gradual return'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), '2024-01-20', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'left', 'Complete ACL rupture with meniscal tear', 'recovered', 300, 'Patellar tendon autograft reconstruction');

  -- Training
  INSERT INTO training_entries (athlete_id, training_date, training_type, duration_minutes, intensity_rpe, load_score, notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body focus'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 45, 6, 270, 'Interval running'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 50, 6, 300, 'Full body'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 75, 8, 600, 'Heavy lifting'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 80, 7, 560, 'Match practice'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 45, 5, 225, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'flexibility', 40, 3, 120, 'Recovery session');

  -- Wellness
  INSERT INTO wellness_entries (athlete_id, sleep_quality, fatigue, muscle_soreness, stress_level, mood_state, recovery_feeling, wellness_score, submitted_at) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), 9, 3, 3, 2, 9, 9, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 63, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), 7, 5, 4, 4, 7, 7, 73, CURRENT_DATE - INTERVAL '1 day');

  -- Notifications
  INSERT INTO notifications (user_id, title, message, type, read, created_at) VALUES
    (v_admin_uuid, 'Welcome Admin', 'Full platform access granted.', 'success', false, NOW()),
    (v_coach_uuid, 'Welcome Coach', 'Team dashboard is ready.', 'success', false, NOW()),
    (v_athlete_uuid, 'Welcome Athlete', 'Complete your profile.', 'info', false, NOW());

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Athletes: %', (SELECT COUNT(*) FROM athletes);
  RAISE NOTICE 'Injuries: %', (SELECT COUNT(*) FROM injuries);
  RAISE NOTICE 'Training: %', (SELECT COUNT(*) FROM training_entries);
  RAISE NOTICE 'Wellness: %', (SELECT COUNT(*) FROM wellness_entries);
  RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications);
  RAISE NOTICE '========================================';

END $$;

-- Verification
SELECT up.role, up.full_name, COUNT(DISTINCT a.id) as athletes, COUNT(DISTINCT i.id) as injuries
FROM user_profiles up
LEFT JOIN athletes a ON a.user_id = up.user_id
LEFT JOIN injuries i ON i.athlete_id = a.id
WHERE up.role IN ('administrator', 'coach', 'athlete')
GROUP BY up.role, up.full_name, up.user_id
ORDER BY CASE up.role WHEN 'administrator' THEN 1 WHEN 'coach' THEN 2 ELSE 3 END;
