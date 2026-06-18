-- Seed data for Injury Intelligence Platform
-- Run this in Supabase SQL Editor after schema migration

-- Helper: Create auth users first via Supabase Auth UI or API
-- Then insert profiles manually.

-- Sample Athletes
INSERT INTO athletes (full_name, age, gender, height, weight, sport, playing_position, dominant_side, training_experience, previous_injury_history) VALUES
  ('Alex Johnson', 24, 'male', 185, 82, 'Soccer', 'Forward', 'right', 'advanced', 'ACL reconstruction right knee (2022)'),
  ('Maria Garcia', 26, 'female', 170, 65, 'Basketball', 'Point Guard', 'right', 'advanced', 'Ankle sprain left (2023)'),
  ('James Smith', 22, 'male', 190, 88, 'American Football', 'Linebacker', 'left', 'intermediate', 'Concussion (2023)'),
  ('Sarah Williams', 23, 'female', 168, 60, 'Volleyball', 'Outside Hitter', 'right', 'intermediate', NULL),
  ('David Brown', 27, 'male', 178, 75, 'Rugby', 'Flanker', 'ambidextrous', 'advanced', 'Shoulder dislocation right (2022)'),
  ('Emma Davis', 21, 'female', 172, 63, 'Soccer', 'Midfielder', 'right', 'intermediate', 'Hamstring strain (2024)'),
  ('Michael Wilson', 25, 'male', 182, 80, 'Basketball', 'Small Forward', 'right', 'advanced', 'Stress fracture foot (2023)'),
  ('Lisa Anderson', 24, 'female', 175, 68, 'Soccer', 'Defender', 'left', 'intermediate', NULL),
  ('Chris Taylor', 28, 'male', 188, 85, 'American Football', 'Quarterback', 'right', 'advanced', 'ACL reconstruction left knee (2021)'),
  ('Anna Martinez', 22, 'female', 165, 58, 'CrossFit', 'Athlete', 'right', 'beginner', 'Lower back strain (2024)');

-- Sample Injuries
INSERT INTO injuries (athlete_id, injury_date, injury_type, body_part, severity, mechanism, side, diagnosis, status, estimated_recovery_days, actual_recovery_days, expected_return_date, actual_return_date, return_to_play_date, treatment_notes) VALUES
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), '2024-01-15', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'right', 'Complete ACL rupture', 'recovered', 270, 285, '2024-10-15', '2024-10-28', '2024-11-15', 'Surgical reconstruction with hamstring autograft'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), '2024-03-10', 'Ankle Sprain', 'Ankle', 'moderate', 'contact', 'left', 'Grade 2 ATFL tear', 'recovered', 42, 38, '2024-04-21', '2024-04-17', '2024-04-25', 'RICE protocol followed by progressive rehabilitation'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), '2024-06-20', 'Concussion', 'Head', 'moderate', 'contact', 'n/a', 'Grade 2 concussion', 'recovered', 14, 12, '2024-07-04', '2024-07-02', '2024-07-05', 'Cognitive rest followed by graduated return-to-play protocol'),
  ((SELECT id FROM athletes WHERE full_name = 'David Brown' LIMIT 1), '2024-02-01', 'Shoulder Dislocation', 'Shoulder', 'severe', 'contact', 'right', 'Anterior shoulder dislocation with labral tear', 'recovered', 180, 195, '2024-07-30', '2024-08-15', '2024-09-01', 'Arthroscopic labral repair'),
  ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' LIMIT 1), '2024-08-05', 'Hamstring Strain', 'Hamstring', 'minor', 'non_contact', 'right', 'Grade 1 hamstring strain', 'recovered', 14, 10, '2024-08-19', '2024-08-15', '2024-08-20', 'Active rest and progressive hamstring loading'),
  ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' LIMIT 1), '2024-04-01', 'Stress Fracture', 'Foot', 'moderate', 'overuse', 'right', 'Navicular stress fracture', 'recovering', 84, NULL, '2024-06-24', NULL, NULL, 'Non-weight bearing 6 weeks followed by gradual return'),
  ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' LIMIT 1), '2024-01-20', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'left', 'Complete ACL rupture with meniscal tear', 'recovered', 300, 310, '2024-11-15', '2024-11-25', '2024-12-10', 'Patellar tendon autograft reconstruction'),
  ((SELECT id FROM athletes WHERE full_name = 'Anna Martinez' LIMIT 1), '2024-09-01', 'Lower Back Strain', 'Lower Back', 'minor', 'overuse', 'n/a', 'Acute lumbar strain', 'recovered', 10, 7, '2024-09-11', '2024-09-08', '2024-09-12', 'Activity modification and core strengthening');

-- Sample Training Entries
INSERT INTO training_entries (athlete_id, training_date, training_type, duration_minutes, intensity_rpe, load_score, notes) VALUES
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body focus'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 45, 6, 270, 'Interval running'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'sport_specific', 90, 8, 720, 'Team training'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), CURRENT_DATE - INTERVAL '5 days', 'strength', 60, 7, 420, 'Lower body focus'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), CURRENT_DATE - INTERVAL '6 days', 'agility', 40, 8, 320, 'Plyometrics'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 50, 6, 300, 'Full body'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 40, 7, 280, 'Conditioning'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'sport_specific', 90, 8, 720, 'Team practice'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), CURRENT_DATE - INTERVAL '4 days', 'flexibility', 30, 3, 90, 'Yoga session'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 75, 8, 600, 'Heavy lifting'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'speed', 35, 9, 315, 'Sprint work'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), CURRENT_DATE - INTERVAL '4 days', 'strength', 75, 8, 600, 'Power focus'),
  ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 90, 7, 630, 'Team practice'),
  ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'strength', 50, 6, 300, 'Upper body'),
  ((SELECT id FROM athletes WHERE full_name = 'David Brown' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'cardio', 50, 7, 350, 'Team run'),
  ((SELECT id FROM athletes WHERE full_name = 'David Brown' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'agility', 45, 8, 360, 'Agility drills'),
  ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 80, 7, 560, 'Match practice'),
  ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'recovery', 30, 2, 60, 'Active recovery'),
  ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 45, 5, 225, 'Upper body'),
  ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body'),
  ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'flexibility', 40, 3, 120, 'Recovery session'),
  ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' LIMIT 1), CURRENT_DATE - INTERVAL '3 days', 'cardio', 50, 7, 350, 'Conditioning');

-- Sample Wellness Entries
INSERT INTO wellness_entries (athlete_id, sleep_quality, fatigue, muscle_soreness, stress_level, mood_state, recovery_feeling, wellness_score, submitted_at) VALUES
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), 8, 4, 5, 3, 8, 7, 78, CURRENT_DATE - INTERVAL '1 day'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), 7, 5, 6, 4, 7, 6, 68, CURRENT_DATE - INTERVAL '2 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), 8, 3, 4, 3, 8, 8, 83, CURRENT_DATE - INTERVAL '3 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), 6, 6, 7, 5, 6, 5, 55, CURRENT_DATE - INTERVAL '5 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), 7, 4, 4, 3, 7, 7, 77, CURRENT_DATE - INTERVAL '6 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), 9, 3, 3, 2, 9, 9, 78, CURRENT_DATE - INTERVAL '1 day'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), 8, 4, 4, 3, 8, 8, 78, CURRENT_DATE - INTERVAL '2 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), 7, 5, 5, 4, 7, 7, 77, CURRENT_DATE - INTERVAL '3 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), 8, 3, 3, 3, 8, 8, 78, CURRENT_DATE - INTERVAL '4 days'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), 6, 6, 7, 5, 6, 5, 58, CURRENT_DATE - INTERVAL '1 day'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), 5, 7, 8, 6, 5, 5, 58, CURRENT_DATE - INTERVAL '2 days'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), 7, 5, 6, 4, 7, 6, 58, CURRENT_DATE - INTERVAL '4 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' LIMIT 1), 8, 4, 4, 3, 8, 7, 60, CURRENT_DATE - INTERVAL '1 day'),
  ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' LIMIT 1), 7, 5, 5, 4, 7, 6, 60, CURRENT_DATE - INTERVAL '3 days'),
  ((SELECT id FROM athletes WHERE full_name = 'David Brown' LIMIT 1), 7, 5, 6, 4, 7, 6, 50, CURRENT_DATE - INTERVAL '1 day'),
  ((SELECT id FROM athletes WHERE full_name = 'David Brown' LIMIT 1), 6, 6, 7, 5, 6, 5, 50, CURRENT_DATE - INTERVAL '2 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' LIMIT 1), 8, 4, 5, 3, 8, 7, 63, CURRENT_DATE - INTERVAL '1 day'),
  ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' LIMIT 1), 7, 5, 6, 4, 7, 6, 63, CURRENT_DATE - INTERVAL '2 days'),
  ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' LIMIT 1), 6, 6, 5, 5, 6, 5, 52, CURRENT_DATE - INTERVAL '1 day'),
  ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' LIMIT 1), 7, 5, 4, 4, 7, 7, 73, CURRENT_DATE - INTERVAL '1 day');

-- Sample RTP Phases for Alex Johnson (recovered ACL)
DO $$
DECLARE
  injury_id UUID;
BEGIN
  SELECT id INTO injury_id FROM injuries WHERE injury_type = 'ACL Tear' AND athlete_id = (SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1) LIMIT 1;
  
  INSERT INTO rtp_phases (injury_id, phase_number, phase_name, description, start_date, completion_date, status) VALUES
    (injury_id, 1, 'Rest & Immobilization', 'Initial rest, protection, and pain management', '2024-01-15', '2024-02-15', 'completed'),
    (injury_id, 2, 'Pain-Free Range of Motion', 'Restore full pain-free movement', '2024-02-16', '2024-04-01', 'completed'),
    (injury_id, 3, 'Strength Recovery', 'Regain strength and neuromuscular control', '2024-04-02', '2024-06-15', 'completed'),
    (injury_id, 4, 'Proprioception & Agility', 'Balance, coordination, and cutting movements', '2024-06-16', '2024-08-01', 'completed'),
    (injury_id, 5, 'Sport-Specific Drills', 'Position-specific movements and skills', '2024-08-02', '2024-09-15', 'completed'),
    (injury_id, 6, 'Full Training', 'Unrestricted team training and scrimmage', '2024-09-16', '2024-10-15', 'completed'),
    (injury_id, 7, 'Competition Clearance', 'Medical clearance for match/game play', '2024-10-16', '2024-11-15', 'completed');

  -- Recovery Milestones
  INSERT INTO recovery_milestones (injury_id, milestone_date, milestone_type, description, completed) VALUES
    (injury_id, '2024-02-15', 'medical', 'Splint/crutches discontinued', true),
    (injury_id, '2024-04-01', 'medical', 'Full range of motion achieved', true),
    (injury_id, '2024-06-15', 'strength', 'Quad strength 80% of contralateral', true),
    (injury_id, '2024-08-01', 'proprioception', 'Single leg hop test passed', true),
    (injury_id, '2024-09-15', 'sport_specific', 'Completed sport-specific drills', true),
    (injury_id, '2024-10-15', 'full_training', 'Completed full team training', true),
    (injury_id, '2024-11-15', 'rtp_clearance', 'Medical clearance granted', true);
END $$;

-- Sample Physical Screenings
INSERT INTO physical_screenings (athlete_id, screening_date, fms_deep_squat, fms_hurdle_step, fms_inline_lunge, fms_shoulder_mobility, fms_active_slr, fms_trunk_stability, fms_rotary_stability, fms_total, ybt_leg_length, ybt_anterior_left, ybt_anterior_right, ybt_posteromedial_left, ybt_posteromedial_right, ybt_posterolateral_left, ybt_posterolateral_right, sit_and_reach_cm, slh_left_cm, slh_right_cm, cmj_height_cm, notes) VALUES
  ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' LIMIT 1), '2024-11-20', 2, 2, 2, 3, 3, 2, 2, 16, 90, 65, 64, 105, 107, 100, 102, 28, 185, 180, 45, 'Post-rehab screening. Looking good.'),
  ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' LIMIT 1), '2024-05-01', 3, 2, 3, 3, 2, 2, 2, 17, 85, 60, 62, 100, 98, 95, 97, 32, 170, 172, 40, 'Excellent movement quality'),
  ((SELECT id FROM athletes WHERE full_name = 'James Smith' LIMIT 1), '2024-07-10', 2, 2, 2, 2, 2, 1, 2, 13, 92, 58, 56, 95, 93, 92, 90, 22, 195, 185, 50, 'Hip mobility limitations noted'),
  ((SELECT id FROM athletes WHERE full_name = 'Sarah Williams' LIMIT 1), '2024-08-15', 3, 3, 2, 3, 3, 2, 3, 19, 80, 58, 60, 98, 100, 95, 97, 35, 160, 158, 38, 'Very good overall movement');
