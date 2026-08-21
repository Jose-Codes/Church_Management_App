// Types mirroring the shared Supabase schema (see
// church-management/supabase/schema.sql + migrations, plus this app's own
// supabase/catequist-attendance-app.sql). Only the columns this app reads or
// writes are listed — the real tables have more.

export type UserRole = "member" | "catechist" | "admin";
export type ClassLanguage = "english" | "spanish";
export type AttendanceStatus = "present" | "absent" | "excused";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  church_id: number | null;
};

/** Signing up doesn't make you a catechist — the parish office still has to
 * set the role. Anyone else (including a profile we couldn't load) gets the
 * "not ready yet" screen instead of an empty class list. */
export function canTakeAttendance(profile: Profile | null): boolean {
  return profile?.role === "catechist" || profile?.role === "admin";
}

export type ParishClass = {
  id: number;
  name: string;
  code: string | null;
  language: ClassLanguage | null;
  schedule_text: string | null;
  meets_on: string | null;
  meets_at: string | null;
  meets_days: number[] | null;
  recurring: boolean;
  location: string | null;
};

/** name with the language appended for display, e.g. "OCIA (Spanish)" */
export function classDisplayName(c: Pick<ParishClass, "name" | "language">) {
  if (!c.language) return c.name;
  const label = c.language === "english" ? "English" : "Spanish";
  return `${c.name} (${label})`;
}

// Mirrors public.authorized_pickups — a table the church-management app
// already owns (this app just reads it). No sort_order column; ordering is
// is_primary first, then full_name.
export type AuthorizedPickup = {
  id: number;
  family_member_id: number;
  full_name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
};

export type FamilyMember = {
  id: number;
  family_id: number | null;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  notes: string | null;
  allergies: string | null;
  medical_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  hidden: boolean;
};

export type RosterStudent = FamilyMember & {
  enrollment_id: number;
  authorized_pickups: AuthorizedPickup[];
};

export type AttendanceSession = {
  id: number;
  class_id: number;
  session_date: string;
  notes: string | null;
};

export type AttendanceRecord = {
  id: number;
  session_id: number;
  enrollment_id: number;
  status: AttendanceStatus;
  dropped_off_by: number | null;
  picked_up_by: number | null;
  dropped_off_at: string | null;
  picked_up_at: string | null;
};

/** In-memory attendance state for one roster row while the Catequist is
 * taking attendance, before it's submitted. */
export type AttendanceDraftEntry = {
  enrollmentId: number;
  status: AttendanceStatus;
  droppedOffBy: number | null;
  pickedUpBy: number | null;
};

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth + "T12:00:00");
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

/** Classes serving minors show child info + pickup tracking; adult programs
 * (RCIA/OCIA-adult, adult faith formation, ...) don't need either. */
export function isChild(dateOfBirth: string | null): boolean {
  const age = calculateAge(dateOfBirth);
  return age === null ? true : age < 18;
}
