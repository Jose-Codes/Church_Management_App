# Church Management App

Tools for St. Michael's Parish. This repo currently holds one app:

## [`Parish Attendance Management System/`](Parish%20Attendance%20Management%20System/) — Catequist app

A mobile-first web app (installable as a PWA) that lets **Catequists** (parish
catechism teachers) sign in and manage their own classes:

- **Login** — email/password via Supabase Auth, plus self-service account
  creation. New accounts still need a parish admin to grant Catequist access
  (assign a role and a class) — signing up alone doesn't unlock anything.
- **My Classes** — each Catequist sees only the classes they're assigned to
  teach. Classes that run in both languages are shown as separate entries,
  e.g. "OCIA (English)" / "OCIA (Spanish)".
- **Roster & attendance** — pick a class and a date, mark each student
  present/absent, and submit. Past sessions show a running present/absent
  history.
- **Child safety info** — for classes serving minors, each roster row can
  expand to show allergies, medical/learning notes, and an emergency
  contact, pulled from the student's record.
- **Drop-off / pick-up tracking** — for the same classes, the Catequist picks
  which of a child's authorized contacts dropped them off and picked them up
  that day, from a fixed list (no free text) kept on file for that child.

It reads and writes the **same Supabase project** as the parish's other
(separate) admin/member web app — same classes, students, and families,
just a purpose-built mobile front end for the people taking attendance in
the room. See [`Parish Attendance Management System/supabase/`](Parish%20Attendance%20Management%20System/supabase/)
for the schema this app adds on top of that shared project.

Two files/folders in the app are legacy leftovers from its original
Figma-generated prototype and aren't part of the current app:
`src/app/components/AdminDashboard.tsx` / `Sidebar.tsx` (an old admin view,
unwired) and `mockData.ts` (fake data, superseded by real Supabase queries).

## Running it locally

```bash
cd "Parish Attendance Management System"
npm install
npm run dev
```

Open the printed `http://localhost:5173` in your browser. Sign-in requires
a real account in the shared Supabase project — see
[`Parish Attendance Management System/README.md`](Parish%20Attendance%20Management%20System/README.md#catequist-app-login-classes-attendance-pickup-pwa)
for one-time setup (running the migration, promoting an account to
Catechist, assigning a class).

By default the app points at the shared project's public anon key, which is
safe to ship (Row Level Security enforces access, not the key). To point it
at a different Supabase project instead, copy `.env.example` to `.env.local`
and fill in your own `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

## Verifying it on your phone

The app is mobile-first and installable (Add to Home Screen), so it's worth
actually opening it on a phone rather than just resizing a browser window.

**Same Wi-Fi as your computer (simplest):**

```bash
npm run dev -- --host
```

Vite prints a `Network:` URL like `http://10.0.0.x:5173` — open that in
Safari/Chrome on your phone (same Wi-Fi network, no guest/isolated network),
then use the browser's "Add to Home Screen" / install prompt to get the real
installed-app experience (standalone window, app icon, no browser chrome).

**Not on the same network (e.g. testing over cellular data):** tunnel the
dev server with [ngrok](https://ngrok.com/):

```bash
# terminal 1
npm run dev
# terminal 2
ngrok http 5173
```

Open the `https://…ngrok-free.app` URL ngrok prints, on any network. The
free tier shows a one-time "you're about to visit…" interstitial — tap
**Visit Site** to continue.

**For a stable link others can install too** (not just your own dev
machine): deploy the built app (`npm run build`) to a static host like
Vercel, Netlify, or Cloudflare Pages — any of them will serve the PWA
correctly with zero extra config.
# bounty-fix-ref: https://github.com/Jose-Codes/Church_Management_App/issues/9
