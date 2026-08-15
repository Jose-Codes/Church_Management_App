import { getSupabase } from "./supabaseClient";
import type {
  AttendanceDraftEntry,
  AttendanceRecord,
  AttendanceSession,
  AuthorizedPickup,
  ParishClass,
  Profile,
  RosterStudent,
} from "./types";

// ─── Auth ─────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function resendConfirmation(email: string) {
  const { error } = await getSupabase().auth.resend({ type: "signup", email });
  if (error) throw error;
}

/** Self-service account creation. This only creates the login (auth.users +
 * a 'member'-role profiles row, via the shared project's handle_new_user
 * trigger) — a parish admin still has to promote the new account to
 * 'catechist' and assign it to a class before it can see any roster, since
 * that's an admin-only action under Row Level Security. If the project
 * requires email confirmation, `data.session` comes back null until they
 * click the link in their inbox. */
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback: Parameters<ReturnType<typeof getSupabase>["auth"]["onAuthStateChange"]>[0]) {
  return getSupabase().auth.onAuthStateChange(callback);
}

/** Points the reset-password email at the church-management app's existing
 * /reset-password page, since it already implements that flow against this
 * same Supabase project. Override with VITE_PASSWORD_RESET_URL if this app
 * should host its own instead. */
export async function requestPasswordReset(email: string) {
  const redirectTo = import.meta.env.VITE_PASSWORD_RESET_URL || undefined;
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
  if (error) throw error;
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, full_name, email, role, church_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

// ─── Classes ──────────────────────────────────────────────────────────────

export type MyClass = ParishClass & { studentCount: number };

/** Classes the signed-in Catequist teaches, with a live roster count each. */
export async function getMyClasses(catechistId: string): Promise<MyClass[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("class_catechists")
    .select("class:classes(*)")
    .eq("catechist_id", catechistId);
  if (error) throw error;

  const classes = (data ?? [])
    .map((row) => row.class as unknown as ParishClass | null)
    .filter((c): c is ParishClass => c != null);
  if (classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);
  const { data: enrollments, error: enrollError } = await supabase
    .from("class_enrollments")
    .select("class_id, family_member:family_members!inner(hidden)")
    .in("class_id", classIds)
    .eq("family_member.hidden", false);
  if (enrollError) throw enrollError;

  const counts = new Map<number, number>();
  for (const row of enrollments ?? []) {
    counts.set(row.class_id, (counts.get(row.class_id) ?? 0) + 1);
  }

  return classes
    .map((c) => ({ ...c, studentCount: counts.get(c.id) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Roster ───────────────────────────────────────────────────────────────

export async function getRoster(classId: number): Promise<RosterStudent[]> {
  const { data, error } = await getSupabase()
    .from("class_enrollments")
    .select("id, family_member:family_members!inner(*, authorized_pickups(*))")
    .eq("class_id", classId)
    .eq("family_member.hidden", false);
  if (error) throw error;

  const students = (data ?? [])
    .map((row) => {
      const fm = row.family_member as any;
      if (!fm) return null;
      // No sort_order on authorized_pickups — primary contact first, then by name.
      const contacts = ((fm.authorized_pickups ?? []) as AuthorizedPickup[])
        .slice()
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.full_name.localeCompare(b.full_name));
      return { ...fm, enrollment_id: row.id, authorized_pickups: contacts } as RosterStudent;
    })
    .filter((s): s is RosterStudent => s != null);

  return students.sort((a, b) => a.full_name.localeCompare(b.full_name));
}

// ─── Attendance ───────────────────────────────────────────────────────────

export async function getAttendanceForDate(
  classId: number,
  date: string
): Promise<{ session: AttendanceSession | null; records: AttendanceRecord[] }> {
  const supabase = getSupabase();

  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("class_id", classId)
    .eq("session_date", date)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) return { session: null, records: [] };

  const { data: records, error: recordsError } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("session_id", session.id);
  if (recordsError) throw recordsError;

  return { session: session as AttendanceSession, records: (records ?? []) as AttendanceRecord[] };
}

export async function submitAttendance(
  classId: number,
  date: string,
  entries: AttendanceDraftEntry[]
): Promise<AttendanceSession> {
  const supabase = getSupabase();

  const { data: session, error: sessionError } = await supabase
    .from("attendance_sessions")
    .upsert({ class_id: classId, session_date: date }, { onConflict: "class_id,session_date" })
    .select()
    .single();
  if (sessionError) throw sessionError;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  const rows = entries.map((e) => ({
    session_id: session.id,
    enrollment_id: e.enrollmentId,
    status: e.status,
    recorded_by: user?.id ?? null,
    dropped_off_by: e.droppedOffBy,
    picked_up_by: e.pickedUpBy,
    dropped_off_at: e.droppedOffBy != null ? now : null,
    picked_up_at: e.pickedUpBy != null ? now : null,
  }));

  const { error: recordsError } = await supabase
    .from("attendance_records")
    .upsert(rows, { onConflict: "session_id,enrollment_id" });
  if (recordsError) throw recordsError;

  return session as AttendanceSession;
}

export type RecentSessionSummary = {
  id: number;
  date: string;
  present: number;
  absent: number;
  total: number;
};

export async function getRecentSessions(classId: number, limit = 5): Promise<RecentSessionSummary[]> {
  const { data, error } = await getSupabase()
    .from("attendance_sessions")
    .select("id, session_date, attendance_records(status)")
    .eq("class_id", classId)
    .order("session_date", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((s) => {
    const records = (s.attendance_records ?? []) as { status: string }[];
    const present = records.filter((r) => r.status === "present").length;
    return {
      id: s.id,
      date: s.session_date as string,
      present,
      absent: records.length - present,
      total: records.length,
    };
  });
}
