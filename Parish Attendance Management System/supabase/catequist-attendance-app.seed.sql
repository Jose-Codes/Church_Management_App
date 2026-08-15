-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL DEV SEED — run manually, statement by statement, in the Supabase
-- SQL editor. Run catequist-attendance-app.sql FIRST (this needs the
-- pickup_contacts table and classes.language column it creates).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Test Catequist account ─────────────────────────────────────────────────
-- josepujol21+catequist@gmail.com / CatequistTest2026! was signed up through
-- the app's own "Create Account" flow (so it's a real auth.users row already —
-- this just promotes it). Its profile id: 7bc70b6d-4b96-43d4-a773-d98bc61cb1b9

-- 1. Promote it to catechist and attach it to your church:
update public.profiles
set role = 'catechist',
    church_id = (select id from public.churches order by id limit 1)
where id = '7bc70b6d-4b96-43d4-a773-d98bc61cb1b9';

insert into public.church_memberships (profile_id, church_id, role, approved)
values ('7bc70b6d-4b96-43d4-a773-d98bc61cb1b9', (select id from public.churches order by id limit 1), 'catechist', true)
on conflict (profile_id, church_id) do update set role = 'catechist', approved = true;

-- ─── Pick or create a class ──────────────────────────────────────────────────
-- 2. See what classes already exist:
-- select id, name, language from public.classes;

-- If one already exists, note its id and skip to step 3. Otherwise create one:
-- insert into public.classes (church_id, name, language, schedule_text)
-- values ((select id from public.churches order by id limit 1), 'OCIA', 'english', 'Tuesdays, 6:30 PM')
-- returning id;                                                    -- note as <CLASS_ID>

-- 3. Assign the test Catequist to teach it (replace <CLASS_ID>):
-- insert into public.class_catechists (class_id, catechist_id)
-- values (<CLASS_ID>, '7bc70b6d-4b96-43d4-a773-d98bc61cb1b9')
-- on conflict do nothing;

-- ─── A test child, enrolled, with pickup contacts + safety info ────────────
-- 4. Create the child (replace <CLASS_ID>, note the returned id as <CHILD_ID>):
-- insert into public.family_members
--   (church_id, full_name, relationship, date_of_birth, allergies, medical_notes,
--    emergency_contact_name, emergency_contact_phone)
-- values (
--   (select id from public.churches order by id limit 1),
--   'Test Child', 'child', '2016-04-12',
--   'Peanuts (carries an EpiPen)',
--   'Mild ADHD — benefits from sitting near the front.',
--   'Maria Sanchez', '555-201-4832'
-- )
-- returning id;

-- 5. Enroll the child in the class (replace <CLASS_ID>, <CHILD_ID>):
-- insert into public.class_enrollments (class_id, family_member_id)
-- values (<CLASS_ID>, <CHILD_ID>);

-- 6. Give the child their 3 authorized pickup contacts (replace <CHILD_ID>):
-- insert into public.pickup_contacts (family_member_id, full_name, relationship, phone, sort_order) values
--   (<CHILD_ID>, 'Maria Sanchez',  'Mother',      '555-201-4832', 0),
--   (<CHILD_ID>, 'Carlos Sanchez', 'Father',      '555-201-9911', 1),
--   (<CHILD_ID>, 'Rosa Morales',   'Grandmother', '555-673-2847', 2);

-- ═══════════════════════════════════════════════════════════════════════════
-- After running these, confirm the account's email (check the inbox for
-- josepujol21+catequist@gmail.com), then sign in from the app — "My Classes"
-- should show the class from step 2/3 with the child from steps 4-6 on its
-- roster, allergy/medical info visible, and 3 pickup contacts to choose from.
-- ═══════════════════════════════════════════════════════════════════════════
