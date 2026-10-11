/*
# Adaptive Planner: Settings, Messages, and Schedule Enhancements

## Summary
Extends the adaptive planner with per-user settings (group assignment,
weekly target), a supportive message library, and new schedule columns
to support the moved-workout flow and weekly target enforcement.

## New Tables

### `planner_settings`
- `id` (uuid, primary key)
- `group_assignment` (text) — 'adaptive' or 'fixed'
- `weekly_target` (int, default 3) — max workouts per week
- `setup_complete` (boolean, default false) — whether the student has done the one-step setup
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### `planner_messages`
- `id` (uuid, primary key)
- `message_key` (text) — the situation tag
- `message_text` (text) — the supportive message body
- `created_at` (timestamptz)

## Modified Tables

### `planner_schedule` (new columns)
- `original_date` (date) — the date the workout was originally scheduled on
- `moved_from_date` (date) — the date a workout was moved FROM
- `is_moved` (boolean, default false) — whether this entry was auto-moved
- `moved_accepted` (boolean, default null) — null = not decided, true/false

## Security
- RLS enabled on both new tables.
- Single-tenant (no auth): anon + authenticated can read and write.

## Default Data
- Inserts default settings row (adaptive group, target 3, setup not complete).
- Inserts supportive message library.
*/

-- ---------------------------------------------------------------------------
-- planner_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planner_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_assignment text NOT NULL DEFAULT 'adaptive',
  weekly_target int NOT NULL DEFAULT 3,
  setup_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE planner_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_settings" ON planner_settings;
CREATE POLICY "anon_select_settings"
ON planner_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON planner_settings;
CREATE POLICY "anon_insert_settings"
ON planner_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON planner_settings;
CREATE POLICY "anon_update_settings"
ON planner_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON planner_settings;
CREATE POLICY "anon_delete_settings"
ON planner_settings FOR DELETE
TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- planner_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS planner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_key text NOT NULL,
  message_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE planner_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON planner_messages;
CREATE POLICY "anon_select_messages"
ON planner_messages FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON planner_messages;
CREATE POLICY "anon_insert_messages"
ON planner_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON planner_messages;
CREATE POLICY "anon_update_messages"
ON planner_messages FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON planner_messages;
CREATE POLICY "anon_delete_messages"
ON planner_messages FOR DELETE
TO anon, authenticated USING (true);

-- ---------------------------------------------------------------------------
-- Add columns to planner_schedule
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'planner_schedule' AND column_name = 'original_date') THEN
    ALTER TABLE planner_schedule ADD COLUMN original_date date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'planner_schedule' AND column_name = 'moved_from_date') THEN
    ALTER TABLE planner_schedule ADD COLUMN moved_from_date date;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'planner_schedule' AND column_name = 'is_moved') THEN
    ALTER TABLE planner_schedule ADD COLUMN is_moved boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'planner_schedule' AND column_name = 'moved_accepted') THEN
    ALTER TABLE planner_schedule ADD COLUMN moved_accepted boolean;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Default settings (single row, idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO planner_settings (group_assignment, weekly_target, setup_complete)
SELECT 'adaptive', 3, false
WHERE NOT EXISTS (SELECT 1 FROM planner_settings);

-- ---------------------------------------------------------------------------
-- Default supportive message library
-- ---------------------------------------------------------------------------
INSERT INTO planner_messages (message_key, message_text)
SELECT 'missed_midweek', 'You missed a workout, but that happens. It''s been moved to your next open day — no need to start over.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'missed_midweek' AND message_text = 'You missed a workout, but that happens. It''s been moved to your next open day — no need to start over.');

INSERT INTO planner_messages (message_key, message_text)
SELECT 'missed_no_room', 'No open days left this week for a moved workout. That''s okay — next week starts fresh on Monday.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'missed_no_room' AND message_text = 'No open days left this week for a moved workout. That''s okay — next week starts fresh on Monday.');

INSERT INTO planner_messages (message_key, message_text)
SELECT 'missed_sunday', 'A workout slipped past on Sunday. Nothing carries over — your new week starts fresh tomorrow.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'missed_sunday' AND message_text = 'A workout slipped past on Sunday. Nothing carries over — your new week starts fresh tomorrow.');

INSERT INTO planner_messages (message_key, message_text)
SELECT 'moved_success', 'Your workout''s been rescheduled. Tap accept to keep it there, or pick another available day.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'moved_success' AND message_text = 'Your workout''s been rescheduled. Tap accept to keep it there, or pick another available day.');

INSERT INTO planner_messages (message_key, message_text)
SELECT 'plan_complete_early', 'All your workouts are done this week. Great work — enjoy the rest.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'plan_complete_early' AND message_text = 'All your workouts are done this week. Great work — enjoy the rest.');

INSERT INTO planner_messages (message_key, message_text)
SELECT 'week_complete', 'That''s a wrap on this week. Your next plan will be ready on Monday.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'week_complete' AND message_text = 'That''s a wrap on this week. Your next plan will be ready on Monday.');

INSERT INTO planner_messages (message_key, message_text)
SELECT 'setup_welcome', 'Let''s set up your week. Pick your available days and a weekly target, and we''ll place your beginner plan for you.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'setup_welcome' AND message_text = 'Let''s set up your week. Pick your available days and a weekly target, and we''ll place your beginner plan for you.');

INSERT INTO planner_messages (message_key, message_text)
SELECT 'fixed_group_missed', 'You missed a workout this week. That''s okay — every week is a fresh start on Monday.'
WHERE NOT EXISTS (SELECT 1 FROM planner_messages WHERE message_key = 'fixed_group_missed' AND message_text = 'You missed a workout this week. That''s okay — every week is a fresh start on Monday.');