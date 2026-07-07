#!/usr/bin/env node
/**
 * Multi-User Seed Generator
 * 
 * This script creates 3 users via Supabase Auth API and generates
 * a ready-to-run seed SQL file with correct UUIDs.
 * 
 * Usage:
 *   npx tsx scripts/setup-multiuser.ts
 * 
 * Requirements:
 *   - .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - Internet connection (to call Supabase API)
 *   - Node.js 18+
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus di .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const users = [
  { email: "admin@injuryintel.com", password: "Admin123!@#", name: "Dr. Admin", role: "administrator" },
  { email: "coach@injuryintel.com", password: "Coach123!@#", name: "Head Coach", role: "coach" },
  { email: "athlete@injuryintel.com", password: "Athlete123!@#", name: "Player One", role: "athlete" },
];

async function createUser(user: typeof users[0]) {
  try {
    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: { full_name: user.name },
      },
    });

    if (error) {
      // User might already exist, try to sign in to get UUID
      console.log(`⚠️  ${user.email}: ${error.message} — trying to get existing user...`);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });
      
      if (signInError) {
        console.error(`❌ Failed to access ${user.email}: ${signInError.message}`);
        return null;
      }
      
      return {
        uuid: signInData.user!.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }

    if (data.user) {
      console.log(`✅ Created user: ${user.email} (${data.user.id})`);
      return {
        uuid: data.user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }

    return null;
  } catch (err) {
    console.error(`❌ Error creating ${user.email}:`, err);
    return null;
  }
}

function generateSeedSQL(userData: { uuid: string; email: string; name: string; role: string }[]) {
  const admin = userData.find((u) => u.role === "administrator")!;
  const coach = userData.find((u) => u.role === "coach")!;
  const athlete = userData.find((u) => u.role === "athlete")!;

  return `-- ============================================================================
-- AUTO-GENERATED Multi-User Seed
-- Generated at: ${new Date().toISOString()}
-- ============================================================================

DO $$
DECLARE
  v_admin_uuid  UUID := '${admin.uuid}';
  v_admin_email TEXT := '${admin.email}';
  v_admin_name  TEXT := '${admin.name}';

  v_coach_uuid  UUID := '${coach.uuid}';
  v_coach_email TEXT := '${coach.email}';
  v_coach_name  TEXT := '${coach.name}';

  v_athlete_uuid  UUID := '${athlete.uuid}';
  v_athlete_email TEXT := '${athlete.email}';
  v_athlete_name  TEXT := '${athlete.name}';
BEGIN

  -- ─── Step 1: Create User Profiles ─────────────────────────────────────
  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_admin_uuid, v_admin_email, v_admin_name, 'administrator', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET role = 'administrator', full_name = v_admin_name, updated_at = NOW();

  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_coach_uuid, v_coach_email, v_coach_name, 'coach', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET role = 'coach', full_name = v_coach_name, updated_at = NOW();

  INSERT INTO user_profiles (user_id, email, full_name, role, created_at, updated_at)
  VALUES (v_athlete_uuid, v_athlete_email, v_athlete_name, 'athlete', NOW(), NOW())
  ON CONFLICT (user_id) DO UPDATE SET role = 'athlete', full_name = v_athlete_name, updated_at = NOW();

  RAISE NOTICE 'Profiles created for 3 users';

  -- ─── Step 2: Create Athletes per User ──────────────────────────────────
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

  RAISE NOTICE 'Athletes created: Admin=5, Coach=3, Athlete=1';

  -- ─── Step 3: Create Injuries ───────────────────────────────────────────
  INSERT INTO injuries (athlete_id, injury_date, injury_type, body_part, severity, mechanism, side, diagnosis, status, estimated_recovery_days, treatment_notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), '2024-01-15', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'right', 'Complete ACL rupture', 'recovered', 270, 'Surgical reconstruction with hamstring autograft'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), '2024-03-10', 'Ankle Sprain', 'Ankle', 'moderate', 'contact', 'left', 'Grade 2 ATFL tear', 'recovered', 42, 'RICE protocol and progressive rehabilitation'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), '2024-08-05', 'Hamstring Strain', 'Hamstring', 'minor', 'non_contact', 'right', 'Grade 1 hamstring strain', 'recovered', 14, 'Active rest and progressive hamstring loading'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), '2024-01-20', 'ACL Tear', 'Knee', 'severe', 'non_contact', 'left', 'Complete ACL rupture with meniscal tear', 'recovered', 300, 'Patellar tendon autograft reconstruction');

  -- ─── Step 4: Create Training Entries ───────────────────────────────────
  INSERT INTO training_entries (athlete_id, training_date, training_type, duration_minutes, intensity_rpe, load_score, notes) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body focus'),
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'cardio', 45, 6, 270, 'Interval running'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 50, 6, 300, 'Full body'),
    ((SELECT id FROM athletes WHERE full_name = 'James Smith' AND user_id = v_admin_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 75, 8, 600, 'Heavy lifting'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'sport_specific', 80, 7, 560, 'Match practice'),
    ((SELECT id FROM athletes WHERE full_name = 'Michael Wilson' AND user_id = v_coach_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 45, 5, 225, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '1 day', 'strength', 60, 7, 420, 'Upper body'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'flexibility', 40, 3, 120, 'Recovery session');

  -- ─── Step 5: Create Wellness Entries ───────────────────────────────────
  INSERT INTO wellness_entries (athlete_id, sleep_quality, fatigue, muscle_soreness, stress_level, mood_state, recovery_feeling, wellness_score, submitted_at) VALUES
    ((SELECT id FROM athletes WHERE full_name = 'Alex Johnson' AND user_id = v_admin_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Maria Garcia' AND user_id = v_admin_uuid LIMIT 1), 9, 3, 3, 2, 9, 9, 78, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Emma Davis' AND user_id = v_coach_uuid LIMIT 1), 8, 4, 5, 3, 8, 7, 63, CURRENT_DATE - INTERVAL '1 day'),
    ((SELECT id FROM athletes WHERE full_name = 'Chris Taylor' AND user_id = v_athlete_uuid LIMIT 1), 7, 5, 4, 4, 7, 7, 73, CURRENT_DATE - INTERVAL '1 day');

  -- ─── Step 6: Create Notifications ──────────────────────────────────────
  INSERT INTO notifications (user_id, title, message, type, read, created_at) VALUES
    (v_admin_uuid, 'Welcome Admin', 'Full access granted to platform.', 'success', false, NOW()),
    (v_coach_uuid, 'Welcome Coach', 'Team dashboard is ready.', 'success', false, NOW()),
    (v_athlete_uuid, 'Welcome Athlete', 'Complete your profile.', 'info', false, NOW());

  -- ─── Summary ───────────────────────────────────────────────────────────
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MULTI-USER SEED COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM user_profiles WHERE role IN ('administrator','coach','athlete'));
  RAISE NOTICE 'Athletes: %', (SELECT COUNT(*) FROM athletes);
  RAISE NOTICE 'Injuries: %', (SELECT COUNT(*) FROM injuries);
  RAISE NOTICE 'Training: %', (SELECT COUNT(*) FROM training_entries);
  RAISE NOTICE 'Wellness: %', (SELECT COUNT(*) FROM wellness_entries);
  RAISE NOTICE '========================================';

END $$;

-- Verification query
SELECT 
  up.role,
  up.full_name as user_name,
  COUNT(DISTINCT a.id) as athletes,
  COUNT(DISTINCT i.id) as injuries,
  COUNT(DISTINCT t.id) as training,
  COUNT(DISTINCT w.id) as wellness
FROM user_profiles up
LEFT JOIN athletes a ON a.user_id = up.user_id
LEFT JOIN injuries i ON i.athlete_id = a.id
LEFT JOIN training_entries t ON t.athlete_id = a.id
LEFT JOIN wellness_entries w ON w.athlete_id = a.id
WHERE up.role IN ('administrator', 'coach', 'athlete')
GROUP BY up.role, up.full_name, up.user_id
ORDER BY CASE up.role WHEN 'administrator' THEN 1 WHEN 'coach' THEN 2 ELSE 3 END;
`;
}

async function main() {
  console.log("🏥 Injury Intelligence Platform — Multi-User Setup\n");
  console.log("This will create 3 users and generate seed SQL.\n");

  const userData: { uuid: string; email: string; name: string; role: string }[] = [];

  for (const user of users) {
    console.log(`Creating user: ${user.email}...`);
    const result = await createUser(user);
    if (result) {
      userData.push(result);
    }
  }

  if (userData.length < 3) {
    console.error("\n❌ Failed to create all 3 users. Please check errors above.");
    console.log("\nAlternative: Create users manually via /auth/register and use supabase/seed_v3_multiuser.sql");
    process.exit(1);
  }

  console.log("\n✅ All users created successfully!");
  console.log("\nUser Details:");
  for (const u of userData) {
    console.log(`  ${u.role}: ${u.email} (${u.uuid})`);
  }

  const seedSQL = generateSeedSQL(userData);
  const outputPath = resolve(process.cwd(), "supabase/seed_v3_ready.sql");
  writeFileSync(outputPath, seedSQL);

  console.log(`\n✅ Generated seed SQL: ${outputPath}`);
  console.log("\nNext steps:");
  console.log("  1. Open Supabase Dashboard → SQL Editor");
  console.log("  2. Copy content from: supabase/seed_v3_ready.sql");
  console.log("  3. Paste and click Run");
  console.log("\nLogin credentials:");
  for (const u of users) {
    console.log(`  ${u.role}: ${u.email} / ${u.password}`);
  }
}

main().catch(console.error);
