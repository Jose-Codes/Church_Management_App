import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AttendanceDraftEntry, AttendanceRecord, AuthorizedPickup, RosterStudent } from "../lib/types";
import type { MyClass, RecentSessionSummary } from "../lib/api";

// Same expression the component uses, so "today" lines up even near midnight UTC.
const todayIso = () => new Date().toISOString().split("T")[0];
const daysAgoIso = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().split("T")[0];

const LAST_WEEK = daysAgoIso(7);
const TWO_WEEKS_AGO = daysAgoIso(14);

const GRANDMA: AuthorizedPickup = {
  id: 501,
  family_member_id: 1,
  full_name: "Rosa Reyes",
  relationship: "Grandmother",
  phone: null,
  email: null,
  is_primary: true,
  notes: null,
};

const UNCLE: AuthorizedPickup = { ...GRANDMA, id: 502, full_name: "Luis Reyes", relationship: "Uncle", is_primary: false };

const ANA: RosterStudent = {
  id: 1,
  family_id: 1,
  full_name: "Ana Reyes",
  relationship: "Daughter",
  date_of_birth: "2017-04-02",
  notes: null,
  allergies: null,
  medical_notes: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  hidden: false,
  enrollment_id: 11,
  authorized_pickups: [GRANDMA, UNCLE],
};

// An adult, so only Ana gets the child pickup section.
const MARCO: RosterStudent = {
  ...ANA,
  id: 2,
  full_name: "Marco Diaz",
  date_of_birth: "1988-06-11",
  enrollment_id: 12,
  authorized_pickups: [],
};

const CLASS: MyClass = {
  id: 7,
  name: "Grade 3",
  code: null,
  language: null,
  schedule_text: "Sundays",
  meets_on: null,
  meets_at: null,
  meets_days: null,
  recurring: true,
  location: null,
  studentCount: 2,
};

/** Stand-in for the attendance tables, so a re-submit can be checked for the
 * upsert behaviour the issue depends on rather than just asserting a spy. */
type StoredSession = { id: number; records: AttendanceRecord[] };
const db = new Map<string, StoredSession>();
let nextSessionId = 0;
let nextRecordId = 0;

function seedSession(date: string, entries: Array<Partial<AttendanceRecord> & { enrollment_id: number }>) {
  const id = ++nextSessionId;
  db.set(date, {
    id,
    records: entries.map((e) => ({
      id: ++nextRecordId,
      session_id: id,
      status: "present",
      dropped_off_by: null,
      picked_up_by: null,
      dropped_off_at: null,
      picked_up_at: null,
      ...e,
    })),
  });
}

const submitAttendance = vi.fn(async (_classId: number, date: string, entries: AttendanceDraftEntry[]) => {
  const existing = db.get(date);
  const session: StoredSession = existing ?? { id: ++nextSessionId, records: [] };
  for (const entry of entries) {
    const row = session.records.find((r) => r.enrollment_id === entry.enrollmentId);
    const next = {
      enrollment_id: entry.enrollmentId,
      status: entry.status,
      dropped_off_by: entry.droppedOffBy,
      picked_up_by: entry.pickedUpBy,
    };
    if (row) Object.assign(row, next);
    else session.records.push({ id: ++nextRecordId, session_id: session.id, dropped_off_at: null, picked_up_at: null, ...next });
  }
  db.set(date, session);
  return { id: session.id, class_id: CLASS.id, session_date: date, notes: null };
});

// The real AuthContext keeps this in state, so it stays referentially stable.
// It has to here too: TeacherView's class-loading effect is keyed on the
// profile object, so handing back a fresh one each render loops forever.
const AUTH = {
  profile: { id: "catechist-1", full_name: "Sr. Elena", email: "elena@parish.org", role: "catechist" as const, church_id: 1 },
  signOut: () => Promise.resolve(),
};

vi.mock("../contexts/AuthContext", () => ({ useAuth: () => AUTH }));

vi.mock("../lib/api", () => ({
  getMyClasses: vi.fn(async () => [CLASS]),
  getRoster: vi.fn(async () => [ANA, MARCO]),
  getAttendanceForDate: vi.fn(async (_classId: number, date: string) => {
    const session = db.get(date);
    if (!session) return { session: null, records: [] };
    return { session: { id: session.id, class_id: CLASS.id, session_date: date, notes: null }, records: session.records };
  }),
  getRecentSessions: vi.fn(async (): Promise<RecentSessionSummary[]> =>
    [...db.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, session]) => {
        const present = session.records.filter((r) => r.status === "present").length;
        return { id: session.id, date, present, absent: session.records.length - present, total: session.records.length };
      })
  ),
  submitAttendance,
}));

const { TeacherView } = await import("./TeacherView");

/** Renders and drills into the roster screen for the seeded class. */
async function openRoster() {
  const user = userEvent.setup();
  const view = render(<TeacherView />);
  await user.click(await screen.findByRole("button", { name: /Grade 3/ }));
  await screen.findByRole("button", { name: /Mark Ana Reyes/ });
  return { user, view };
}

const dateInput = (container: HTMLElement) => container.querySelector('input[type="date"]') as HTMLInputElement;
const sessionRow = (date: string) => screen.getByRole("button", { name: new RegExp(`Edit attendance for ${formatted(date)}`) });
const formatted = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

beforeEach(() => {
  db.clear();
  nextSessionId = 0;
  nextRecordId = 0;
  submitAttendance.mockClear();
  // Last week the catechist marked Ana absent by mistake.
  seedSession(LAST_WEEK, [
    { enrollment_id: 11, status: "absent" },
    { enrollment_id: 12, status: "present" },
  ]);
  // The week before, Ana was there and her grandmother dropped her off.
  seedSession(TWO_WEEKS_AGO, [
    { enrollment_id: 11, status: "present", dropped_off_by: GRANDMA.id },
    { enrollment_id: 12, status: "present" },
  ]);
});

describe("Recent Sessions", () => {
  it("renders each session as a button that loads that date's roster and saved statuses", async () => {
    const { user, view } = await openRoster();

    // Today has no session yet, so everyone defaults to present.
    expect(dateInput(view.container).value).toBe(todayIso());
    expect(screen.getByRole("button", { name: "Mark Ana Reyes absent" })).toBeInTheDocument();

    await user.click(sessionRow(LAST_WEEK));

    await waitFor(() => expect(dateInput(view.container).value).toBe(LAST_WEEK));
    // "Mark ... present" is only offered when the saved status was absent.
    expect(await screen.findByRole("button", { name: "Mark Ana Reyes present" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Marco Diaz absent" })).toBeInTheDocument();
    expect(screen.getByText("1 Present")).toBeInTheDocument();
    expect(screen.getByText("1 Absent")).toBeInTheDocument();
  });

  it("prefills the saved pickup selection", async () => {
    const { user, view } = await openRoster();
    await user.click(sessionRow(TWO_WEEKS_AGO));
    await waitFor(() => expect(dateInput(view.container).value).toBe(TWO_WEEKS_AGO));

    await user.click(await screen.findByRole("button", { name: /Child info & pickup/ }));

    const droppedOff = screen.getByRole("group", { name: "Dropped off by" });
    expect(within(droppedOff).getByRole("button", { name: /Rosa Reyes/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(droppedOff).getByRole("button", { name: /Luis Reyes/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("updates the existing session on re-submit instead of creating a duplicate", async () => {
    const { user } = await openRoster();
    await user.click(sessionRow(LAST_WEEK));

    const sessionIdBefore = db.get(LAST_WEEK)!.id;
    const sessionCountBefore = db.size;

    // Fix the mistake: Ana was actually there.
    await user.click(await screen.findByRole("button", { name: "Mark Ana Reyes present" }));
    await user.click(screen.getByRole("button", { name: /Submit Attendance/ }));

    await screen.findByText("Attendance Submitted!");
    expect(submitAttendance).toHaveBeenCalledWith(CLASS.id, LAST_WEEK, expect.anything());
    expect(db.size).toBe(sessionCountBefore);
    expect(db.get(LAST_WEEK)!.id).toBe(sessionIdBefore);
    expect(db.get(LAST_WEEK)!.records.find((r) => r.enrollment_id === 11)!.status).toBe("present");
    expect(db.get(LAST_WEEK)!.records).toHaveLength(2);
  });

  // The date picker stays visible on the success screen while the session
  // rows do not, so this is the way a catechist actually lands on a different
  // date straight after submitting.
  it("clears the success screen when the date changes while it's showing", async () => {
    const { user, view } = await openRoster();
    await user.click(screen.getByRole("button", { name: /Submit Attendance/ }));
    await screen.findByText("Attendance Submitted!");

    fireEvent.change(dateInput(view.container), { target: { value: TWO_WEEKS_AGO } });

    await waitFor(() => expect(screen.queryByText("Attendance Submitted!")).not.toBeInTheDocument());
    expect(await screen.findByRole("button", { name: "Mark Ana Reyes absent" })).toBeInTheDocument();
  });

  it("loads a different session after submitting and returning to the roster", async () => {
    const { user, view } = await openRoster();
    await user.click(screen.getByRole("button", { name: /Submit Attendance/ }));
    await screen.findByText("Attendance Submitted!");

    await user.click(screen.getByRole("button", { name: "Edit Attendance" }));
    await user.click(sessionRow(LAST_WEEK));

    await waitFor(() => expect(dateInput(view.container).value).toBe(LAST_WEEK));
    expect(screen.queryByText("Attendance Submitted!")).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Mark Ana Reyes present" })).toBeInTheDocument();
  });

  it("gives each row a phone-sized tap target and a pressed state", async () => {
    await openRoster();
    const row = sessionRow(LAST_WEEK);

    expect(row.tagName).toBe("BUTTON");
    expect(row).toHaveStyle({ minHeight: "56px" });
    expect(row.className).toContain("active:opacity-60");
  });

  it("marks the session currently being edited", async () => {
    const { user } = await openRoster();
    expect(sessionRow(LAST_WEEK)).not.toHaveAttribute("aria-current");

    await user.click(sessionRow(LAST_WEEK));

    await waitFor(() => expect(sessionRow(LAST_WEEK)).toHaveAttribute("aria-current", "true"));
    expect(sessionRow(TWO_WEEKS_AGO)).not.toHaveAttribute("aria-current");
  });
});
