export type UserRole = 'athlete' | 'coach' | 'physiotherapist' | 'sport_scientist' | 'administrator';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    role?: UserRole;
  };
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
  link?: string;
}

export type Gender = "male" | "female" | "other";
export type DominantSide = "left" | "right" | "ambidextrous";

export interface Athlete {
  id: string;
  full_name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  sport: string;
  playing_position: string;
  dominant_side: DominantSide;
  training_experience: string;
  previous_injury_history: string | null;
  avatar_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WellnessEntry {
  id: string;
  athlete_id: string;
  sleep_quality: number;
  fatigue: number;
  muscle_soreness: number;
  stress_level: number;
  mood_state: number;
  recovery_feeling: number;
  wellness_score: number;
  submitted_at: string;
}

export interface WellnessTrend {
  date: string;
  wellness_score: number;
  sleep_quality: number;
  fatigue: number;
  muscle_soreness: number;
  stress_level: number;
  mood_state: number;
  recovery_feeling: number;
}

export type TrainingType = "strength" | "cardio" | "endurance" | "agility" | "speed" | "flexibility" | "recovery" | "sport_specific" | "other";

export interface TrainingEntry {
  id: string;
  athlete_id: string;
  training_date: string;
  training_type: TrainingType;
  duration_minutes: number;
  intensity_rpe: number;
  load_score: number;
  notes: string | null;
  created_at: string;
}

export interface TrainingSummary {
  total_sessions: number;
  total_load: number;
  avg_intensity: number;
  avg_duration: number;
  daily_load: number;
  weekly_load: number;
  monthly_load: number;
  acute_load: number;
  chronic_load: number;
  acwr: number;
}

export interface AcwrDataPoint {
  date: string;
  acute_load: number;
  chronic_load: number;
  acwr: number;
  risk_zone: "low" | "optimal" | "high" | "very_high";
}

export interface AcwrAlert {
  id: string;
  severity: "info" | "warning" | "danger";
  title: string;
  message: string;
  date: string;
  acwr_value: number;
}

export interface PhysicalScreening {
  id: string;
  athlete_id: string;
  screening_date: string;
  notes: string | null;
  created_at: string;

  // Functional Movement Screen (each 0-3, total 0-21)
  fms_deep_squat: number | null;
  fms_hurdle_step: number | null;
  fms_inline_lunge: number | null;
  fms_shoulder_mobility: number | null;
  fms_active_slr: number | null;
  fms_trunk_stability: number | null;
  fms_rotary_stability: number | null;
  fms_total: number | null;

  // Y Balance Test — Lower Quarter (reach in cm)
  ybt_leg_length: number | null;
  ybt_anterior_left: number | null;
  ybt_anterior_right: number | null;
  ybt_posteromedial_left: number | null;
  ybt_posteromedial_right: number | null;
  ybt_posterolateral_left: number | null;
  ybt_posterolateral_right: number | null;
  ybt_composite_left: number | null;
  ybt_composite_right: number | null;

  // Sit and Reach
  sit_and_reach_cm: number | null;

  // Single Leg Hop (distance in cm)
  slh_left_cm: number | null;
  slh_right_cm: number | null;
  slh_ratio: number | null;

  // Countermovement Jump
  cmj_height_cm: number | null;
  cmj_peak_power_w: number | null;
  cmj_relative_power: number | null;
}

export interface RiskDataPoint {
  date: string;
  risk_score: number;
  risk_level: "low" | "moderate" | "high";
}

export type InjurySeverity = "minor" | "moderate" | "severe";
export type InjuryStatus = "active" | "recovering" | "recovered" | "chronic";
export type InjuryMechanism = "contact" | "non_contact" | "overuse";
export type InjurySide = "left" | "right" | "bilateral" | "n/a";

export interface InjuryRecord {
  id: string;
  athlete_id: string;
  injury_date: string;
  injury_type: string;
  body_part: string;
  severity: InjurySeverity;
  mechanism: InjuryMechanism | null;
  side: InjurySide;
  diagnosis: string | null;
  status: InjuryStatus;
  estimated_recovery_days: number | null;
  actual_recovery_days: number | null;
  expected_return_date: string | null;
  actual_return_date: string | null;
  return_to_play_date: string | null;
  treatment_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MilestoneType = "medical" | "rehab" | "strength" | "proprioception" | "sport_specific" | "full_training" | "rtp_clearance" | "other";

export interface RecoveryMilestone {
  id: string;
  injury_id: string;
  milestone_date: string;
  milestone_type: MilestoneType;
  description: string;
  completed: boolean;
  created_at: string;
}

export type RtpPhaseStatus = "pending" | "in_progress" | "completed";

export interface RtpPhase {
  id: string;
  injury_id: string;
  phase_number: number;
  phase_name: string;
  description: string;
  start_date: string | null;
  completion_date: string | null;
  status: RtpPhaseStatus;
  created_at: string;
}

export const RTP_PHASES: { phase_number: number; phase_name: string; description: string }[] = [
  { phase_number: 1, phase_name: "Rest & Immobilization", description: "Initial rest, protection, and pain management" },
  { phase_number: 2, phase_name: "Pain-Free Range of Motion", description: "Restore full pain-free movement" },
  { phase_number: 3, phase_name: "Strength Recovery", description: "Regain strength and neuromuscular control" },
  { phase_number: 4, phase_name: "Proprioception & Agility", description: "Balance, coordination, and cutting movements" },
  { phase_number: 5, phase_name: "Sport-Specific Drills", description: "Position-specific movements and skills" },
  { phase_number: 6, phase_name: "Full Training", description: "Unrestricted team training and scrimmage" },
  { phase_number: 7, phase_name: "Competition Clearance", description: "Medical clearance for match/game play" },
];

export interface ScreeningScore {
  mobility: number;
  stability: number;
  asymmetry: number;
  fms_score: number;
  date: string;
}

export interface ModelPrediction {
  model_name: string;
  probability_7d: number;
  probability_14d: number;
  probability_30d: number;
  feature_importance: { feature: string; importance: number }[];
}

export interface PredictiveAnalytics {
  inputs: {
    wellness_score: number;
    acwr: number;
    fms_total: number | null;
    injury_history_score: number;
    training_load: number;
    age: number;
    playing_time_score: number;
  };
  models: ModelPrediction[];
  ensemble: {
    probability_7d: number;
    probability_14d: number;
    probability_30d: number;
    risk_level_7d: "low" | "moderate" | "high" | "very_high";
    risk_level_14d: "low" | "moderate" | "high" | "very_high";
    risk_level_30d: "low" | "moderate" | "high" | "very_high";
  };
}

export interface Assessment {
  id: string;
  athlete_id: string;
  assessment_date: string;
  type: string;
  score: number;
  notes: string | null;
  created_at: string;
}

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

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  children?: NavItem[];
}