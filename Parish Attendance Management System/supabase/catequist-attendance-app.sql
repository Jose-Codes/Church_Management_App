-- ═══════════════════════════════════════════════════════════════════════════
-- CATEQUIST ATTENDANCE APP — run in the SAME Supabase project as the
-- church-management app, after reports-notes-forms.sql. Safe to re-run.
--
-- This app (a separate front-end, same database) needs two things the main
-- schema doesn't have yet:
--   1. A language marker on classes, so a program can run English/Spanish
--      sections (e.g. "OCIA" with language='english' and another "OCIA" row
--      with language='spanish'). Null = not language-specific.
--   2. Per-child authorized drop-off/pick-up contacts, and a place on each
--      attendance record to say which of those contacts dropped off / picked
--      up that day.
--
-- Everything here is additive (add column/table if not exists) and reuses
-- the existing security-definer helpers from fix-recursion.sql
-- (is_admin / can_manage_member / catechist_sees_member) so it can't
-- reintroduce the "infinite recursion" bug that file fixed — same pattern,
-- applied to a new table.
-- ═══════════════════════════════════════════════════════════════════════════

set check_function_bodies = off;

-- 1. Class language ──────────────────────────────────────────────────────────
alter table public.classes
  add column if not exists language text check (language in ('english', 'spanish'));

-- 2. Pickup contacts ─────────────────────────────────────────────────────────
create table if not exists public.pickup_contacts (
  id                bigint generated always as identity primary key,
  family_member_id  bigint not null references public.family_members (id) on delete cascade,
  full_name         text not null,
  relationship      text,                     -- 'Mother', 'Grandmother', 'Neighbor', etc.
  phone             text,
  sort_order        smallint not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists idx_pickup_contacts_member on public.pickup_contacts (family_member_id);

alter table public.pickup_contacts enable row level security;

drop policy if exists "pickup_contacts: family, catechist, admin view" on public.pickup_contacts;
create policy "pickup_contacts: family, catechist, admin view"
  on public.pickup_contacts for select to authenticated
  using (
    public.is_admin()
    or public.member_in_my_family(family_member_id)
    or public.catechist_sees_member(family_member_id)
  );

drop policy if exists "pickup_contacts: parents, catechists, admins manage" on public.pickup_contacts;
create policy "pickup_contacts: parents, catechists, admins manage"
  on public.pickup_contacts for all to authenticated
  using (
    public.is_admin()
    or public.can_manage_member(family_member_id)
    or public.catechist_sees_member(family_member_id)
  )
  with check (
    public.is_admin()
    or public.can_manage_member(family_member_id)
    or public.catechist_sees_member(family_member_id)
  );

-- 3. Who dropped off / picked up, per attendance record ─────────────────────
alter table public.attendance_records
  add column if not exists dropped_off_by bigint references public.pickup_contacts (id) on delete set null,
  add column if not exists picked_up_by   bigint references public.pickup_contacts (id) on delete set null,
  add column if not exists dropped_off_at timestamptz,
  add column if not exists picked_up_at   timestamptz;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE.
--   • Existing classes keep language = null (shown with no language suffix)
--     until an admin sets 'english' / 'spanish' on the relevant rows.
--   • Existing children have no pickup_contacts until someone adds their 3
--     authorized people. The Catequist app only lets a Catequist SELECT among
--     a child's contacts when recording drop-off/pick-up — parents/admins add
--     the contacts themselves (a parent portal or admin screen), or insert
--     manually for now:
--       insert into pickup_contacts (family_member_id, full_name, relationship, phone)
--       values (123, 'Maria Sanchez', 'Mother', '555-201-4832');
-- ═══════════════════════════════════════════════════════════════════════════
