-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL DEV SEED — run manually, statement by statement, in the Supabase
-- SQL editor. Run catequist-attendance-app.sql FIRST.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Test Catequist account ─────────────────────────────────────────────────
-- josepujol21+catequist@gmail.com / CatequistTest2026! — already created,
-- confirmed, promoted to catechist, and attached to the church. Nothing to
-- do here. Its profile id: 7bc70b6d-4b96-43d4-a773-d98bc61cb1b9

-- ─── Test class ──────────────────────────────────────────────────────────────
-- Already created and assigned: "OCIA" (language='english'), class id 70,
-- taught by the test Catequist above. Nothing to do here.

-- ─── Test child ──────────────────────────────────────────────────────────────
-- Already created and enrolled in class 70: "Test Child", family_member_id
-- 854, with allergies/medical_notes/emergency_contact already set. Nothing
-- to do here.

-- ─── Pickup contacts (this is the part that changed) ────────────────────────
-- An earlier version of catequist-attendance-app.sql created a redundant
-- pickup_contacts table and this file seeded 3 rows into it. That table is
-- now dropped — the real table (already owned by the church-management app)
-- is authorized_pickups, with an is_primary flag instead of a sort order.
-- Run this once to give "Test Child" (854) real authorized pickup contacts:

insert into public.authorized_pickups (family_member_id, full_name, relationship, phone, is_primary) values
  (854, 'Maria Sanchez',  'Mother',      '555-201-4832', true),
  (854, 'Carlos Sanchez', 'Father',      '555-201-9911', false),
  (854, 'Rosa Morales',   'Grandmother', '555-673-2847', false);

-- ─── For a second test child / class from scratch ───────────────────────────
-- select id, name, language from public.classes;
-- insert into public.classes (church_id, name, language, schedule_text)
-- values ((select id from public.churches order by id limit 1), 'OCIA', 'spanish', 'Tuesdays, 6:30 PM')
-- returning id;                                                     -- <CLASS_ID>
-- insert into public.class_catechists (class_id, catechist_id)
-- values (<CLASS_ID>, '7bc70b6d-4b96-43d4-a773-d98bc61cb1b9') on conflict do nothing;
-- insert into public.family_members
--   (church_id, full_name, relationship, date_of_birth, allergies, medical_notes,
--    emergency_contact_name, emergency_contact_phone)
-- values (
--   (select id from public.churches order by id limit 1),
--   'Another Child', 'child', '2015-09-01', null, null, 'Parent Name', '555-000-0000'
-- ) returning id;                                                    -- <CHILD_ID>
-- insert into public.class_enrollments (class_id, family_member_id) values (<CLASS_ID>, <CHILD_ID>);
-- insert into public.authorized_pickups (family_member_id, full_name, relationship, phone, is_primary) values
--   (<CHILD_ID>, 'Someone', 'Mother', '555-111-2222', true);

-- ═══════════════════════════════════════════════════════════════════════════
-- After running the authorized_pickups insert above, refresh the app and
-- open the OCIA roster — "Test Child" should now show 3 tappable contacts
-- under both "Dropped off by" and "Picked up by" (★ marks the primary one).
-- ═══════════════════════════════════════════════════════════════════════════
