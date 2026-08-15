-- ═══════════════════════════════════════════════════════════════════════════
-- CATEQUIST ATTENDANCE APP — run in the SAME Supabase project as the
-- church-management app. Safe to re-run.
--
-- This app (a separate front-end, same database) needs one thing the schema
-- files in this repo don't have: a language marker on classes, so a program
-- can run English/Spanish sections (e.g. "OCIA" with language='english' and
-- another "OCIA" row with language='spanish'). Null = not language-specific.
--
-- Drop-off/pick-up tracking turned out to already exist:
-- attendance_records.dropped_off_by / picked_up_by already reference a
-- public.authorized_pickups table (family_member_id, full_name, relationship,
-- phone, email, is_primary, notes) that isn't in any file in this repo's
-- supabase/ folder — it was applied straight to the project (or lives in a
-- migration this repo never had, e.g. class-posters.sql territory). The app
-- reads that table directly now. An earlier version of this file created a
-- redundant public.pickup_contacts table before that was discovered — the
-- cleanup below drops it. If you already ran that earlier version and seeded
-- test contacts into pickup_contacts, re-add them to authorized_pickups
-- instead (see catequist-attendance-app.seed.sql).
-- ═══════════════════════════════════════════════════════════════════════════

set check_function_bodies = off;

-- 1. Class language ──────────────────────────────────────────────────────────
alter table public.classes
  add column if not exists language text check (language in ('english', 'spanish'));

-- 2. Drop-off/pick-up timestamps ─────────────────────────────────────────────
-- dropped_off_by / picked_up_by already exist (referencing authorized_pickups).
-- Just make sure the "when" columns are there too.
alter table public.attendance_records
  add column if not exists dropped_off_at timestamptz,
  add column if not exists picked_up_at   timestamptz;

-- 3. Cleanup — drop the redundant table an earlier version of this file
--    created before authorized_pickups was discovered. No-op if you never ran
--    that version.
drop table if exists public.pickup_contacts cascade;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE.
--   • Existing classes keep language = null (shown with no language suffix)
--     until an admin sets 'english' / 'spanish' on the relevant rows.
--   • Pickup contacts are managed wherever authorized_pickups is already
--     managed in the church-management app (or insert manually for now):
--       insert into authorized_pickups (family_member_id, full_name, relationship, phone, is_primary)
--       values (123, 'Maria Sanchez', 'Mother', '555-201-4832', true);
-- ═══════════════════════════════════════════════════════════════════════════
