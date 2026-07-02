-- ⚠️ Drop existing objects first (safe to re-run)
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS physical_screenings CASCADE;
DROP TABLE IF EXISTS wellness_entries CASCADE;
DROP TABLE IF EXISTS training_entries CASCADE;
DROP TABLE IF EXISTS recovery_milestones CASCADE;
DROP TABLE IF EXISTS rtp_phases CASCADE;
DROP TABLE IF EXISTS injuries CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS athletes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TYPE IF EXISTS rtp_phase_status CASCADE;
DROP TYPE IF EXISTS milestone_type CASCADE;
DROP TYPE IF EXISTS injury_side CASCADE;
DROP TYPE IF EXISTS injury_mechanism CASCADE;
DROP TYPE IF EXISTS injury_status CASCADE;
DROP TYPE IF EXISTS injury_severity CASCADE;
DROP TYPE IF EXISTS training_type CASCADE;
DROP TYPE IF EXISTS dominant_side CASCADE;
DROP TYPE IF EXISTS gender CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enums
CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'physiotherapist', 'sport_scientist', 'administrator');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE dominant_side AS ENUM ('left', 'right', 'ambidextrous');
CREATE TYPE training_type AS ENUM ('strength', 'cardio', 'endurance', 'agility', 'speed', 'flexibility', 'recovery', 'sport_specific', 'other');
CREATE TYPE injury_severity AS ENUM ('minor', 'moderate', 'severe');
CREATE TYPE injury_status AS ENUM ('active', 'recovering', 'recovered', 'chronic');
CREATE TYPE injury_mechanism AS ENUM ('contact', 'non_contact', 'overuse');
CREATE TYPE injury_side AS ENUM ('left', 'right', 'bilateral', 'n/a');
CREATE TYPE milestone_type AS ENUM ('medical', 'rehab', 'strength', 'proprioception', 'sport_specific', 'full_training', 'rtp_clearance', 'other');
CREATE TYPE rtp_phase_status AS ENUM ('pending', 'in_progress', 'completed');

-- User Profiles (syncs with auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'athlete',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_update"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Athletes
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  age INT NOT NULL,
  gender gender NOT NULL,
  height NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  sport TEXT NOT NULL,
  playing_position TEXT NOT NULL,
  dominant_side dominant_side DEFAULT 'right',
  training_experience TEXT DEFAULT 'beginner',
  previous_injury_history TEXT,
  avatar_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athletes_select"
  ON athletes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "athletes_insert"
  ON athletes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "athletes_update"
  ON athletes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "athletes_delete"
  ON athletes FOR DELETE
  USING (auth.role() = 'authenticated');

-- Injuries
CREATE TABLE injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  injury_date DATE NOT NULL,
  injury_type TEXT NOT NULL,
  body_part TEXT NOT NULL,
  severity injury_severity NOT NULL,
  mechanism injury_mechanism,
  side injury_side DEFAULT 'n/a',
  diagnosis TEXT,
  status injury_status DEFAULT 'active',
  estimated_recovery_days INT,
  actual_recovery_days INT,
  expected_return_date DATE,
  actual_return_date DATE,
  return_to_play_date DATE,
  treatment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "injuries_select"
  ON injuries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "injuries_insert"
  ON injuries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "injuries_update"
  ON injuries FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "injuries_delete"
  ON injuries FOR DELETE
  USING (auth.role() = 'authenticated');

-- Recovery Milestones
CREATE TABLE recovery_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  injury_id UUID NOT NULL REFERENCES injuries(id) ON DELETE CASCADE,
  milestone_date DATE NOT NULL,
  milestone_type milestone_type NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recovery_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_select"
  ON recovery_milestones FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "milestones_insert"
  ON recovery_milestones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "milestones_update"
  ON recovery_milestones FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "milestones_delete"
  ON recovery_milestones FOR DELETE
  USING (auth.role() = 'authenticated');

-- Return to Play Phases
CREATE TABLE rtp_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  injury_id UUID NOT NULL REFERENCES injuries(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  phase_name TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE,
  completion_date DATE,
  status rtp_phase_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(injury_id, phase_number)
);

ALTER TABLE rtp_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rtp_select"
  ON rtp_phases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "rtp_insert"
  ON rtp_phases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "rtp_update"
  ON rtp_phases FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "rtp_delete"
  ON rtp_phases FOR DELETE
  USING (auth.role() = 'authenticated');

-- Training Entries
CREATE TABLE training_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  training_date DATE NOT NULL,
  training_type training_type NOT NULL,
  duration_minutes INT NOT NULL,
  intensity_rpe INT NOT NULL CHECK (intensity_rpe >= 1 AND intensity_rpe <= 10),
  load_score NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE training_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_select"
  ON training_entries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "training_insert"
  ON training_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "training_update"
  ON training_entries FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "training_delete"
  ON training_entries FOR DELETE
  USING (auth.role() = 'authenticated');

-- Wellness Entries
CREATE TABLE wellness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  sleep_quality INT NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  fatigue INT NOT NULL CHECK (fatigue >= 1 AND fatigue <= 10),
  muscle_soreness INT NOT NULL CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
  stress_level INT NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
  mood_state INT NOT NULL CHECK (mood_state >= 1 AND mood_state <= 10),
  recovery_feeling INT NOT NULL CHECK (recovery_feeling >= 1 AND recovery_feeling <= 10),
  wellness_score NUMERIC NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wellness_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wellness_select"
  ON wellness_entries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "wellness_insert"
  ON wellness_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "wellness_update"
  ON wellness_entries FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "wellness_delete"
  ON wellness_entries FOR DELETE
  USING (auth.role() = 'authenticated');

-- Physical Screenings
CREATE TABLE physical_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  screening_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Functional Movement Screen (0-3 each)
  fms_deep_squat INT CHECK (fms_deep_squat >= 0 AND fms_deep_squat <= 3),
  fms_hurdle_step INT CHECK (fms_hurdle_step >= 0 AND fms_hurdle_step <= 3),
  fms_inline_lunge INT CHECK (fms_inline_lunge >= 0 AND fms_inline_lunge <= 3),
  fms_shoulder_mobility INT CHECK (fms_shoulder_mobility >= 0 AND fms_shoulder_mobility <= 3),
  fms_active_slr INT CHECK (fms_active_slr >= 0 AND fms_active_slr <= 3),
  fms_trunk_stability INT CHECK (fms_trunk_stability >= 0 AND fms_trunk_stability <= 3),
  fms_rotary_stability INT CHECK (fms_rotary_stability >= 0 AND fms_rotary_stability <= 3),
  fms_total INT CHECK (fms_total >= 0 AND fms_total <= 21),

  -- Y Balance Test
  ybt_leg_length NUMERIC,
  ybt_anterior_left NUMERIC,
  ybt_anterior_right NUMERIC,
  ybt_posteromedial_left NUMERIC,
  ybt_posteromedial_right NUMERIC,
  ybt_posterolateral_left NUMERIC,
  ybt_posterolateral_right NUMERIC,
  ybt_composite_left NUMERIC,
  ybt_composite_right NUMERIC,

  -- Sit and Reach
  sit_and_reach_cm NUMERIC,

  -- Single Leg Hop
  slh_left_cm NUMERIC,
  slh_right_cm NUMERIC,
  slh_ratio NUMERIC,

  -- Countermovement Jump
  cmj_height_cm NUMERIC,
  cmj_peak_power_w NUMERIC,
  cmj_relative_power NUMERIC
);

ALTER TABLE physical_screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "screenings_select"
  ON physical_screenings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "screenings_insert"
  ON physical_screenings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "screenings_update"
  ON physical_screenings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "screenings_delete"
  ON physical_screenings FOR DELETE
  USING (auth.role() = 'authenticated');

-- Assessments
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

-- Appointments
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

-- Messages
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

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_athletes_user_id ON athletes(user_id);
CREATE INDEX idx_injuries_athlete_id ON injuries(athlete_id);
CREATE INDEX idx_injuries_status ON injuries(status);
CREATE INDEX idx_recovery_milestones_injury_id ON recovery_milestones(injury_id);
CREATE INDEX idx_rtp_phases_injury_id ON rtp_phases(injury_id);
CREATE INDEX idx_training_entries_athlete_id ON training_entries(athlete_id);
CREATE INDEX idx_training_entries_date ON training_entries(training_date);
CREATE INDEX idx_wellness_entries_athlete_id ON wellness_entries(athlete_id);
CREATE INDEX idx_wellness_entries_submitted_at ON wellness_entries(submitted_at);
CREATE INDEX idx_physical_screenings_athlete_id ON physical_screenings(athlete_id);
CREATE INDEX idx_assessments_athlete_id ON assessments(athlete_id);
CREATE INDEX idx_appointments_athlete_id ON appointments(athlete_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_injuries_updated_at
  BEFORE UPDATE ON injuries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
