import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Phone,
  Send,
  StickyNote,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { NoClassesAssignedNotice } from "./AccountNotReadyView";
import {
  getAttendanceForDate,
  getMyClasses,
  getRecentSessions,
  getRoster,
  submitAttendance,
  type MyClass,
  type RecentSessionSummary,
} from "../lib/api";
import { calculateAge, classDisplayName, isChild, type AttendanceDraftEntry, type AttendanceStatus, type RosterStudent } from "../lib/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m || 0, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatSchedule(cls: MyClass): string {
  const time = cls.meets_at ? formatTime(cls.meets_at) : null;
  if (cls.meets_days && cls.meets_days.length > 0) {
    const days = cls.meets_days.map((d) => DAY_NAMES[d]).join("/");
    return time ? `${days}${cls.recurring ? "s" : ""} at ${time}` : days;
  }
  if (cls.meets_on) {
    const label = new Date(cls.meets_on + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return time ? `${label} at ${time}` : label;
  }
  return cls.schedule_text || "Schedule TBD";
}

function formatSessionDate(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function TeacherView() {
  const { profile } = useAuth();

  const [classes, setClasses] = useState<MyClass[] | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSessionSummary[]>([]);

  const [drafts, setDrafts] = useState<Record<number, AttendanceDraftEntry>>({});
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const rosterScrollRef = useRef<HTMLDivElement>(null);

  // Load "my classes" once we know who's signed in.
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    getMyClasses(profile.id)
      .then((cs) => !cancelled && setClasses(cs))
      .catch(() => !cancelled && setClassesError("Couldn't load your classes. Pull to refresh or try again shortly."));
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const selectedClass = classes?.find((c) => c.id === selectedClassId) ?? null;

  // Load roster + existing attendance whenever the class or date changes.
  useEffect(() => {
    if (selectedClassId == null) return;
    let cancelled = false;
    setRoster(null);
    setRosterError(null);
    setSubmitted(false);
    setSubmitError(null);
    setExpandedStudentId(null);

    Promise.all([getRoster(selectedClassId), getAttendanceForDate(selectedClassId, selectedDate), getRecentSessions(selectedClassId)])
      .then(([students, attendance, recent]) => {
        if (cancelled) return;
        setRoster(students);
        setRecentSessions(recent);
        const byEnrollment = new Map(attendance.records.map((r) => [r.enrollment_id, r]));
        const initial: Record<number, AttendanceDraftEntry> = {};
        for (const s of students) {
          const existing = byEnrollment.get(s.enrollment_id);
          initial[s.enrollment_id] = {
            enrollmentId: s.enrollment_id,
            status: existing?.status ?? "present",
            droppedOffBy: existing?.dropped_off_by ?? null,
            pickedUpBy: existing?.picked_up_by ?? null,
          };
        }
        setDrafts(initial);
      })
      .catch(() => !cancelled && setRosterError("Couldn't load this class's roster. Try again shortly."));

    return () => {
      cancelled = true;
    };
  }, [selectedClassId, selectedDate]);

  const presentCount = useMemo(() => Object.values(drafts).filter((d) => d.status === "present").length, [drafts]);
  const totalCount = roster?.length ?? 0;
  const absentCount = totalCount - presentCount;

  const setStatus = (enrollmentId: number, status: AttendanceStatus) => {
    setDrafts((prev) => ({ ...prev, [enrollmentId]: { ...prev[enrollmentId], status } }));
  };

  const setPickup = (enrollmentId: number, key: "droppedOffBy" | "pickedUpBy", contactId: number | null) => {
    setDrafts((prev) => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        [key]: prev[enrollmentId][key] === contactId ? null : contactId,
      },
    }));
  };

  const handleSubmit = async () => {
    if (selectedClassId == null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitAttendance(selectedClassId, selectedDate, Object.values(drafts));
      setSubmitted(true);
      setRecentSessions(await getRecentSessions(selectedClassId));
    } catch (err) {
      console.error("submitAttendance failed:", err);
      const isNetworkError = err instanceof TypeError; // fetch throws TypeError when it can't reach the network at all
      const detail = !isNetworkError && err instanceof Error ? err.message : null;
      setSubmitError(
        isNetworkError
          ? "Couldn't reach the server — check your connection and try again."
          : `Couldn't submit attendance${detail ? `: ${detail}` : ""}. Try again in a moment.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Jump back to a past session from the Recent Sessions list. Changing the
  // date re-runs the roster effect, which reloads the saved statuses and
  // clears the success screen; clearing it here too covers re-tapping the
  // session that's already open, where the date doesn't actually change.
  const openSession = (date: string) => {
    setSubmitted(false);
    setSelectedDate(date);
    // The list sits below the roster, so without this the catechist stays
    // parked at the bottom of the page while the roster reloads above them.
    rosterScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToClasses = () => {
    setSelectedClassId(null);
    setRoster(null);
  };

  // ── "My Classes" screen ───────────────────────────────────────────────
  if (!selectedClassId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-5 py-5 border-b flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>My Classes</h1>
          {classes?.length !== 0 && (
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>Select a class to take attendance</p>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          {classesError && <ErrorNote text={classesError} />}

          {!classesError && classes === null && <LoadingNote text="Loading your classes…" />}

          {classes && classes.length === 0 && <NoClassesAssignedNotice />}

          <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
            {classes?.map((cls) => (
              <button
                key={cls.id}
                onClick={() => {
                  setSelectedClassId(cls.id);
                  setSelectedDate(todayIso());
                }}
                className="text-left rounded-2xl border p-5 transition-all"
                style={{ background: "var(--card)", borderColor: "var(--border)", cursor: "pointer" }}
              >
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
                  {classDisplayName(cls)}
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12 }}>{formatSchedule(cls)}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} style={{ color: "var(--primary)" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>{cls.studentCount} students</span>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Roster / attendance screen ────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="px-4 pt-4 pb-4 border-b flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <button
          onClick={backToClasses}
          className="flex items-center gap-1.5 mb-2"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 13 }}
        >
          <ArrowLeft size={14} />
          Back to Classes
        </button>

        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>
          {selectedClass ? classDisplayName(selectedClass) : ""}
        </h1>
        {selectedClass && (
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>{formatSchedule(selectedClass)}</p>
        )}

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border mt-3" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 500 }}>Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ fontSize: 14, fontWeight: 500, border: "none", background: "transparent", color: "var(--foreground)", outline: "none" }}
          />
          {selectedDate < todayIso() && (
            <span className="ml-auto" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>
              Editing a past session
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Pill bg="#DCFCE7" fg="#166534" icon={<CheckCircle2 size={13} />}>
            {presentCount} Present
          </Pill>
          <Pill bg="#FEE2E2" fg="#991B1B">
            {absentCount} Absent
          </Pill>
          <Pill bg="var(--muted)" fg="var(--muted-foreground)">
            {totalCount} Total
          </Pill>
        </div>
      </header>

      {submitted ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#DCFCE7" }}>
            <CheckCircle2 size={40} style={{ color: "#16A34A" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>Attendance Submitted!</h2>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
            {presentCount} present, {absentCount} absent — recorded for {formatSessionDate(selectedDate)}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 px-6 py-2.5 rounded-xl border"
            style={{ fontSize: 14, fontWeight: 500, background: "transparent", borderColor: "var(--border)", color: "var(--primary)", cursor: "pointer" }}
          >
            Edit Attendance
          </button>
        </div>
      ) : (
        <>
          <div ref={rosterScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {rosterError && <ErrorNote text={rosterError} />}
            {!rosterError && roster === null && <LoadingNote text="Loading roster…" />}

            <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
              {roster?.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  draft={drafts[student.enrollment_id]}
                  expanded={expandedStudentId === student.id}
                  onToggleExpand={() => setExpandedStudentId((cur) => (cur === student.id ? null : student.id))}
                  onSetStatus={(status) => setStatus(student.enrollment_id, status)}
                  onSetPickup={(key, contactId) => setPickup(student.enrollment_id, key, contactId)}
                />
              ))}
            </div>

            {recentSessions.length > 0 && (
              <div className="mt-8 max-w-md mx-auto w-full">
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--primary)", marginBottom: 2 }}>
                  Recent Sessions
                </h2>
                <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 10 }}>Tap a session to review or correct it.</p>
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  {recentSessions.map((s, i) => {
                    const isOpen = s.date === selectedDate;
                    return (
                      <button
                        key={s.id}
                        onClick={() => openSession(s.date)}
                        aria-current={isOpen ? "true" : undefined}
                        aria-label={`Edit attendance for ${formatSessionDate(s.date)} — ${s.present} present, ${s.absent} absent`}
                        className="w-full flex items-center justify-between gap-3 text-left px-4 transition-colors active:opacity-60"
                        style={{
                          minHeight: 56,
                          paddingTop: 12,
                          paddingBottom: 12,
                          border: "none",
                          borderTop: i > 0 ? "1px solid var(--border)" : "none",
                          background: isOpen ? "var(--muted)" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: isOpen ? 600 : 400, color: "var(--foreground)" }}>{formatSessionDate(s.date)}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "#DCFCE7", color: "#166534" }}>
                            {s.present} present
                          </span>
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 600, background: "#FEE2E2", color: "#991B1B" }}>
                            {s.absent} absent
                          </span>
                          <ChevronRight size={14} style={{ color: "var(--muted-foreground)" }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div
            className="px-4 border-t flex-shrink-0"
            style={{ background: "var(--card)", borderColor: "var(--border)", paddingTop: 14, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 14px)" }}
          >
            <div className="max-w-md mx-auto w-full">
              {submitError && <p style={{ fontSize: 12, color: "var(--destructive)", marginBottom: 8, textAlign: "center" }}>{submitError}</p>}
              <button
                onClick={handleSubmit}
                disabled={submitting || !roster || roster.length === 0}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-3"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  cursor: submitting ? "default" : "pointer",
                  fontSize: 16,
                  fontWeight: 700,
                  opacity: submitting || !roster || roster.length === 0 ? 0.6 : 1,
                  boxShadow: "0 4px 16px rgba(27,58,92,0.3)",
                }}
              >
                {submitting ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? "Submitting…" : "Submit Attendance"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StudentRow({
  student,
  draft,
  expanded,
  onToggleExpand,
  onSetStatus,
  onSetPickup,
}: {
  student: RosterStudent;
  draft: AttendanceDraftEntry | undefined;
  expanded: boolean;
  onToggleExpand: () => void;
  onSetStatus: (status: AttendanceStatus) => void;
  onSetPickup: (key: "droppedOffBy" | "pickedUpBy", contactId: number | null) => void;
}) {
  const isPresent = (draft?.status ?? "present") === "present";
  const age = calculateAge(student.date_of_birth);
  const child = isChild(student.date_of_birth);
  const initials = student.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hasSafetyInfo = Boolean(student.allergies || student.medical_notes);

  return (
    <div
      className="rounded-2xl border p-4 transition-all"
      style={{ background: "var(--card)", borderColor: isPresent ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.2)", borderWidth: 1.5 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: isPresent ? "#DCFCE7" : "#FEE2E2", fontSize: 13, fontWeight: 700, color: isPresent ? "#16A34A" : "#DC2626" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate" style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>
                {student.full_name}
              </p>
              {hasSafetyInfo && <AlertTriangle size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{age != null ? `${age} yrs old` : student.relationship}</p>
          </div>
        </div>

        <button
          onClick={() => onSetStatus(isPresent ? "absent" : "present")}
          className="relative rounded-full flex-shrink-0"
          style={{ width: 58, height: 32, background: isPresent ? "#16A34A" : "#E5E7EB", border: "none", cursor: "pointer" }}
          aria-label={`Mark ${student.full_name} ${isPresent ? "absent" : "present"}`}
        >
          <div
            className="absolute top-1 rounded-full bg-white"
            style={{ width: 24, height: 24, left: isPresent ? 30 : 4, boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}
          />
        </button>
      </div>

      <button
        onClick={onToggleExpand}
        className="flex items-center gap-1 mt-3"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: 12, fontWeight: 600 }}
      >
        {expanded ? "Hide details" : child ? "Child info & pickup" : "Details"}
        <ChevronDown size={13} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {expanded && (
        <div className="mt-3 pt-3 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border)" }}>
          {(student.allergies || student.medical_notes || student.notes) && (
            <div className="flex flex-col gap-2">
              {student.allergies && <InfoLine icon={<AlertTriangle size={13} />} label="Allergies" value={student.allergies} tone="warn" />}
              {student.medical_notes && <InfoLine icon={<StickyNote size={13} />} label="Medical / Learning Notes" value={student.medical_notes} tone="warn" />}
              {student.notes && <InfoLine icon={<StickyNote size={13} />} label="Notes" value={student.notes} />}
            </div>
          )}
          {(student.emergency_contact_name || student.emergency_contact_phone) && (
            <InfoLine
              icon={<Phone size={13} />}
              label="Emergency Contact"
              value={[student.emergency_contact_name, student.emergency_contact_phone].filter(Boolean).join(" · ")}
            />
          )}

          {child && (
            <>
              <PickupPicker
                label="Dropped off by"
                contacts={student.authorized_pickups}
                selectedId={draft?.droppedOffBy ?? null}
                onSelect={(id) => onSetPickup("droppedOffBy", id)}
              />
              <PickupPicker
                label="Picked up by"
                contacts={student.authorized_pickups}
                selectedId={draft?.pickedUpBy ?? null}
                onSelect={(id) => onSetPickup("pickedUpBy", id)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PickupPicker({
  label,
  contacts,
  selectedId,
  onSelect,
}: {
  label: string;
  contacts: RosterStudent["authorized_pickups"];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </p>
      {contacts.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No authorized contacts on file yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {contacts.map((c) => {
            const selected = selectedId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className="px-3 py-1.5 rounded-full border"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: selected ? "var(--primary)" : "var(--muted)",
                  color: selected ? "#fff" : "var(--foreground)",
                  borderColor: selected ? "var(--primary)" : "var(--border)",
                }}
              >
                {c.is_primary ? "★ " : ""}
                {c.full_name}
                {c.relationship ? ` · ${c.relationship}` : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoLine({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "warn" }) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-xl"
      style={{ background: tone === "warn" ? "#FFF7ED" : "var(--muted)" }}
    >
      <span style={{ color: tone === "warn" ? "var(--accent)" : "var(--muted-foreground)", marginTop: 1 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        <p style={{ fontSize: 13, color: "var(--foreground)", lineHeight: 1.4 }}>{value}</p>
      </div>
    </div>
  );
}

function Pill({ bg, fg, icon, children }: { bg: string; fg: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ fontSize: 12, fontWeight: 600, background: bg, color: fg }}>
      {icon}
      {children}
    </span>
  );
}

function LoadingNote({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 justify-center py-10" style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
      <LoaderCircle size={16} className="animate-spin" />
      {text}
    </div>
  );
}

function ErrorNote({ text }: { text: string }) {
  return (
    <p className="max-w-md mx-auto" style={{ fontSize: 13, color: "var(--destructive)", background: "#FEF2F2", borderRadius: 12, padding: 14, marginBottom: 12 }}>
      {text}
    </p>
  );
}
