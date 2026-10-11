/*
# Adaptive Workout Planner

## Summary
Adds tables for an adaptive workout planner that lets students set their weekly
availability, follow a default beginner workout plan, and have missed workouts
automatically rescheduled to their next available day. This is a single-tenant
app (no auth), so all data is public/shared and accessible via the anon key.

## New Tables

### `planner_availability`
- `id` (uuid, primary key)
- `day_of_week` (text, not null) — e.g. "Monday", "Tuesday"
- `is_available` (boolean, default true) — whether the student can work out that day
- `updated_at` (timestamptz) — last modification time
- Single row per day of week (enforced by unique constraint on day_of_week)

### `planner_workouts`
- `id` (uuid, primary key)
- `name` (text, not null) — e.g. "Full Body A", "Full Body B"
- `description` (text) — what the workout involves
- `order_index` (int, default 0) — ordering within the plan sequence
- `is_rest_day` (boolean, default false) — marks this as a rest entry in the rotation
- `created_at` (timestamptz)

### `planner_schedule`
- `id` (uuid, primary key)
- `scheduled_date` (date, not null) — the date the workout is planned for
- `workout_id` (uuid, foreign key → planner_workouts, ON DELETE CASCADE)
- `status` (text, default 'pending') — 'pending' | 'completed' | 'missed'
- `completed_at` (timestamptz) — when the workout was checked in (null if not done)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Unique constraint on scheduled_date to prevent double-booking a day

## Security
- RLS enabled on all tables.
- Single-tenant (no auth): anon + authenticated can read and write all data.
- No user_id columns, no auth.uid() checks.

## Indexes
- Index on `planner_schedule.scheduled_date` for fast date lookups.
- Index on `planner_schedule.status` for filtering pending/missed workouts.

## Default Data
- Inserts a default beginner plan: Full Body A, Full Body B, and a Rest day,
  cycling in that order.
- Inserts 7 rows in planner_availability, one per day, all available by default
  except Sunday (rest day).
*/

-- ---------------------------------------------------------------------------
-- planner_availability: which days the student can work out
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planner_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week text NOT NULL UNIQUE,
  is_available boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE planner_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_availability" ON planner_availability;
CREATE POLICY "anon_select_availability"
ON planner_availability FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_availability" ON planner_availability;
CREATE POLICY "anon_insert_availability"
ON planner_availability FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_availability" ON planner_availability;
CREATE POLICY "anon_update_availability"
ON planner_availability FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_availability" ON planner_availability;
CREATE POLICY "anon_delete_availability"
ON planner_availability FOR DELETE
TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- planner_workouts: the plan's workout definitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planner_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  order_index int NOT NULL DEFAULT 0,
  is_rest_day boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE planner_workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workouts" ON planner_workouts;
CREATE POLICY "anon_select_workouts"
ON planner_workouts FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workouts" ON planner_workouts;
CREATE POLICY "anon_insert_workouts"
ON planner_workouts FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workouts" ON planner_workouts;
CREATE POLICY "anon_update_workouts"
ON planner_workouts FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workouts" ON planner_workouts;
CREATE POLICY "anon_delete_workouts"
ON planner_workouts FOR DELETE
TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- planner_schedule: assigned workouts on specific dates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planner_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date date NOT NULL UNIQUE,
  workout_id uuid REFERENCES planner_workouts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE planner_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_schedule" ON planner_schedule;
CREATE POLICY "anon_select_schedule"
ON planner_schedule FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_schedule" ON planner_schedule;
CREATE POLICY "anon_insert_schedule"
ON planner_schedule FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_schedule" ON planner_schedule;
CREATE POLICY "anon_update_schedule"
ON planner_schedule FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_schedule" ON planner_schedule;
CREATE POLICY "anon_delete_schedule"
ON planner_schedule FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_planner_schedule_date
ON planner_schedule(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_planner_schedule_status
ON planner_schedule(status);

-- ---------------------------------------------------------------------------
-- Default beginner plan: Full Body A → Full Body B → Rest, cycling
-- ---------------------------------------------------------------------------
INSERT INTO planner_workouts (name, description, order_index, is_rest_day)
SELECT 'Full Body A', 'Squats, push-ups, rows, planks — 3 sets each', 0, false
WHERE NOT EXISTS (SELECT 1 FROM planner_workouts WHERE name = 'Full Body A');

INSERT INTO planner_workouts (name, description, order_index, is_rest_day)
SELECT 'Full Body B', 'Lunges, dips, shoulder presses, dead bugs — 3 sets each', 1, false
WHERE NOT EXISTS (SELECT 1 FROM planner_workouts WHERE name = 'Full Body B');

INSERT INTO planner_workouts (name, description, order_index, is_rest_day)
SELECT 'Rest Day', 'Active recovery — walk, stretch, or take it easy', 2, true
WHERE NOT EXISTS (SELECT 1 FROM planner_workouts WHERE name = 'Rest Day');

-- ---------------------------------------------------------------------------
-- Default availability: all days available except Sunday
-- ---------------------------------------------------------------------------
INSERT INTO planner_availability (day_of_week, is_available)
SELECT 'Monday', true
WHERE NOT EXISTS (SELECT 1 FROM planner_availability WHERE day_of_week = 'Monday');

INSERT INTO planner_availability (day_of_week, is_available)
SELECT 'Tuesday', true
WHERE NOT EXISTS (SELECT 1 FROM planner_availability WHERE day_of_week = 'Tuesday');

INSERT INTO planner_availability (day_of_week, is_available)
SELECT 'Wednesday', true
WHERE NOT EXISTS (SELECT 1 FROM planner_availability WHERE day_of_week = 'Wednesday');

INSERT INTO planner_availability (day_of_week, is_available)
SELECT 'Thursday', true
WHERE NOT EXISTS (SELECT 1 FROM planner_availability WHERE day_of_week = 'Thursday');

INSERT INTO planner_availability (day_of_week, is_available)
SELECT 'Friday', true
WHERE NOT EXISTS (SELECT 1 FROM planner_availability WHERE day_of_week = 'Friday');

INSERT INTO planner_availability (day_of_week, is_available)
SELECT 'Saturday', true
WHERE NOT EXISTS (SELECT 1 FROM planner_availability WHERE day_of_week = 'Saturday');

INSERT INTO planner_availability (day_of_week, is_available)
SELECT 'Sunday', false
WHERE NOT EXISTS (SELECT 1 FROM planner_availability WHERE day_of_week = 'Sunday');