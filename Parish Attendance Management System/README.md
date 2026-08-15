
  # Parish Attendance Management System

  This is a code bundle for Parish Attendance Management System. The original project is available at https://www.figma.com/design/678POaGZHbNAh7Mw7VIkVY/Parish-Attendance-Management-System.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Catequist app (login, classes, attendance, pickup, PWA)

  This app now signs Catequists in and reads/writes real data instead of the
  mock data in `src/app/components/mockData.ts` (that file, `AdminDashboard.tsx`
  and `Sidebar.tsx` are unused leftovers from the original Figma prototype —
  kept in the repo but not wired into `App.tsx`).

  It talks to the **same Supabase project as the `church-management` app**
  (see `src/app/lib/supabaseClient.ts`). One-time setup:

  1. In that project's Supabase SQL editor, run
     [`supabase/catequist-attendance-app.sql`](supabase/catequist-attendance-app.sql).
     It's additive/idempotent — adds a `language` column to `classes`, a new
     `pickup_contacts` table, and drop-off/pick-up columns on
     `attendance_records`. It does not touch or remove anything.
  2. Create the data a Catequist needs to see something (or adapt the
     commented-out statements in
     [`supabase/catequist-attendance-app.seed.sql`](supabase/catequist-attendance-app.seed.sql)):
     - Set an existing signed-up user's `profiles.role` to `'catechist'`.
     - Add a `class_catechists` row assigning them to a class.
     - Optionally set that class's `language` to `'english'` or `'spanish'`.
     - Add up to 3 `pickup_contacts` rows for each enrolled child, and fill in
       `family_members.allergies` / `medical_notes` / `emergency_contact_*`
       where relevant.
  3. `npm i && npm run dev`, sign in with that Catequist's email/password.

  To point the app at a *different* Supabase project instead (e.g. your own
  scratch project while developing), copy `.env.example` to `.env.local` and
  fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

  ### PWA

  `npm run build` now also emits a web app manifest and service worker
  (via `vite-plugin-pwa`), so the built app is installable — "Add to Home
  Screen" on a phone gives it an app icon and a standalone (no browser chrome)
  window. The app shell is precached for fast loads; attendance data still
  requires a live connection to read/write (no offline queueing of
  medical-adjacent data yet).
  