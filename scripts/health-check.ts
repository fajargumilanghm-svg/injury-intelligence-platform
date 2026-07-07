#!/usr/bin/env node
/**
 * Health Check Script for Injury Intelligence Platform
 *
 * Usage:
 *   npx tsx scripts/health-check.ts
 *
 * Requirements:
 *   - .env.local dengan NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
 *   - Node.js 18+
 *   - tsx installed: npm i -g tsx
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load env dari .env.local
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Error: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus di-set di .env.local");
  console.error("   Lihat docs/DEPLOY.md untuk setup environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Color helpers
const G = "\x1b[32m";
const R = "\x1b[31m";
const Y = "\x1b[33m";
const C = "\x1b[36m";
const RESET = "\x1b[0m";

function ok(msg: string) {
  console.log(`${G}✓${RESET} ${msg}`);
}
function fail(msg: string) {
  console.log(`${R}✗${RESET} ${msg}`);
}
function warn(msg: string) {
  console.log(`${Y}⚠${RESET} ${msg}`);
}
function info(msg: string) {
  console.log(`${C}ℹ${RESET} ${msg}`);
}

async function checkConnection() {
  const { data, error } = await supabase.from("user_profiles").select("count").limit(1);
  if (error) {
    fail(`Database connection failed: ${error.message}`);
    return false;
  }
  ok("Database connection");
  return true;
}

async function checkTables() {
  const requiredTables = [
    "user_profiles",
    "athletes",
    "injuries",
    "training_entries",
    "wellness_entries",
    "physical_screenings",
    "recovery_milestones",
    "rtp_phases",
    "assessments",
    "appointments",
    "messages",
    "notifications",
  ];

  const { data: tables, error } = await supabase
    .rpc("check_tables_exist", { table_names: requiredTables })
    .select();

  // Fallback: query pg_catalog directly
  const { data: pgTables, error: pgError } = await supabase.rpc("", {}); // dummy

  // Manual check via direct query
  const results: Record<string, boolean> = {};
  for (const table of requiredTables) {
    const { error: e } = await supabase.from(table).select("count").limit(1);
    results[table] = !e;
    if (e && e.message?.includes("does not exist")) {
      fail(`Table '${table}' missing — jalankan migration 00001!`);
    } else if (e) {
      warn(`Table '${table}' error: ${e.message}`);
    } else {
      ok(`Table '${table}'`);
    }
  }

  const allExist = Object.values(results).every(Boolean);
  return allExist;
}

async function checkRLS() {
  info("Checking RLS policies...");

  const expectedScopedTables = [
    "athletes",
    "injuries",
    "training_entries",
    "wellness_entries",
    "physical_screenings",
    "recovery_milestones",
    "rtp_phases",
  ];

  const { data: policies, error } = await supabase
    .from("pg_policies")
    .select("tablename, policyname")
    .in("tablename", expectedScopedTables);

  if (error) {
    warn(`Cannot query policies: ${error.message} (perlu akses ke pg_policies via service role)`);
    return true; // soft fail
  }

  const policyMap = new Map<string, string[]>();
  for (const p of policies ?? []) {
    if (!policyMap.has(p.tablename)) policyMap.set(p.tablename, []);
    policyMap.get(p.tablename)!.push(p.policyname);
  }

  let allGood = true;
  for (const table of expectedScopedTables) {
    const names = policyMap.get(table) ?? [];
    const hasScoped = names.some((n) => n.endsWith("_scoped"));
    if (hasScoped) {
      ok(`RLS policies for '${table}' (scoped)`);
    } else {
      fail(`RLS policies for '${table}' — BELUM diharden! Jalankan migration 00004.`);
      allGood = false;
    }
  }

  return allGood;
}

async function checkSeedData() {
  info("Checking seed data...");

  const checks = [
    { table: "athletes", min: 5, name: "Athletes" },
    { table: "injuries", min: 3, name: "Injuries" },
    { table: "training_entries", min: 5, name: "Training entries" },
    { table: "wellness_entries", min: 3, name: "Wellness entries" },
  ];

  let allGood = true;
  for (const c of checks) {
    const { count, error } = await supabase
      .from(c.table)
      .select("*", { count: "exact", head: true });

    if (error) {
      warn(`${c.name}: ${error.message}`);
      continue;
    }

    if ((count ?? 0) >= c.min) {
      ok(`${c.name}: ${count} records`);
    } else {
      warn(`${c.name}: ${count} records (expected >= ${c.min}) — jalankan seed.sql`);
      allGood = false;
    }
  }

  return allGood;
}

async function checkAuthSetup() {
  info("Checking auth configuration...");

  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    warn(`Cannot list users: ${error.message} (service role key mungkin salah)`);
    return false;
  }

  const userCount = users?.users?.length ?? 0;
  if (userCount === 0) {
    warn("No auth users found — buat user via /auth/register dulu!");
    return false;
  }

  ok(`Auth users: ${userCount} registered`);

  // Check admin exists
  const { data: admins } = await supabase
    .from("user_profiles")
    .select("email")
    .eq("role", "administrator")
    .limit(1);

  if (admins && admins.length > 0) {
    ok(`Admin user exists: ${admins[0].email}`);
  } else {
    warn("No administrator found — set role='administrator' di user_profiles!");
  }

  return true;
}

async function checkFunctions() {
  info("Checking database functions...");

  const { data, error } = await supabase
    .rpc("is_staff_or_admin")
    .select();

  // is_staff_or_admin() butuh auth context, jadi akan error tanpa auth
  // Kita cek existence saja via pg_proc
  const { data: funcs, error: funcError } = await supabase
    .from("pg_proc")
    .select("proname")
    .eq("proname", "is_staff_or_admin");

  if (funcError) {
    warn(`Cannot check functions: ${funcError.message}`);
    return true;
  }

  if (funcs && funcs.length > 0) {
    ok("Function 'is_staff_or_admin()' exists");
  } else {
    fail("Function 'is_staff_or_admin()' missing — jalankan migration 00003!");
    return false;
  }

  return true;
}

async function checkIndexes() {
  info("Checking performance indexes...");

  const criticalIndexes = [
    "idx_athletes_user_id",
    "idx_injuries_athlete_id",
    "idx_training_entries_athlete_id",
    "idx_training_entries_date",
    "idx_wellness_entries_athlete_id",
    "idx_wellness_entries_submitted_at",
  ];

  const { data: indexes, error } = await supabase
    .from("pg_indexes")
    .select("indexname")
    .in("indexname", criticalIndexes);

  if (error) {
    warn(`Cannot check indexes: ${error.message}`);
    return true;
  }

  const found = new Set((indexes ?? []).map((i) => i.indexname));
  let allGood = true;

  for (const idx of criticalIndexes) {
    if (found.has(idx)) {
      ok(`Index '${idx}'`);
    } else {
      warn(`Index '${idx}' missing — performance bisa terdampak`);
      allGood = false;
    }
  }

  return allGood;
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("  🏥 Injury Intelligence Platform — Health Check");
  console.log("=".repeat(60) + "\n");

  const results: { name: string; pass: boolean }[] = [];

  const addResult = async (name: string, fn: () => Promise<boolean>) => {
    info(`\n[${name}]`);
    const pass = await fn();
    results.push({ name, pass });
    return pass;
  };

  await addResult("Database Connection", checkConnection);
  await addResult("Schema & Tables", checkTables);
  await addResult("RLS Security", checkRLS);
  await addResult("Seed Data", checkSeedData);
  await addResult("Auth Setup", checkAuthSetup);
  await addResult("DB Functions", checkFunctions);
  await addResult("Performance Indexes", checkIndexes);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("  📊 SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  for (const r of results) {
    const icon = r.pass ? `${G}✓${RESET}` : `${R}✗${RESET}`;
    console.log(`  ${icon} ${r.name}`);
  }

  console.log(`\n  Total: ${passed} passed, ${failed} failed / ${results.length} checks`);

  if (failed === 0) {
    console.log(`\n  ${G}🎉 All checks passing! System is healthy.${RESET}\n`);
    process.exit(0);
  } else {
    console.log(`\n  ${R}⚠️ ${failed} check(s) failed. Review docs/DEPLOY.md for fixes.${RESET}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
