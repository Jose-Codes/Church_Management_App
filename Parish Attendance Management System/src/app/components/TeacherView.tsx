import { useState } from "react";
import { CheckCircle2, Clock, Users, ChevronRight, ArrowLeft, Send } from "lucide-react";
import { CLASSES, STUDENTS, ATTENDANCE_RECORDS } from "./mockData";
import type { AttendanceRecord } from "./mockData";

type AttState = Record<string, boolean>;

export function TeacherView() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<AttState>({});
  const [submitted, setSubmitted] = useState(false);

  // Teacher only sees first two classes for this demo
  const myClasses = CLASSES.filter(c => ["c1", "c6"].includes(c.id));

  const selectedClass = CLASSES.find(c => c.id === selectedClassId);
  const classStudents = STUDENTS.filter(s => s.classId === selectedClassId && s.active);

  const initAttendance = (classId: string, date: string) => {
    const init: AttState = {};
    STUDENTS.filter(s => s.classId === classId).forEach(s => {
      const existing = ATTENDANCE_RECORDS.find(r => r.studentId === s.id && r.date === date);
      init[s.id] = existing ? existing.present : true;
    });
    return init;
  };

  const handleSelectClass = (id: string) => {
    setSelectedClassId(id);
    setAttendance(initAttendance(id, selectedDate));
    setSubmitted(false);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedClassId) {
      setAttendance(initAttendance(selectedClassId, date));
      setSubmitted(false);
    }
  };

  const toggle = (studentId: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = classStudents.length - presentCount;

  const handleSubmit = () => {
    setSubmitted(true);
  };

  // Class selection view
  if (!selectedClassId) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Keep teacher headers readable with phone-sized gutters and fluid titles. */}
        <header className="flex-shrink-0 border-b px-4 py-4 sm:px-6 md:px-8 md:py-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 700, color: "var(--primary)" }}>
            My Classes
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
            Select a class to take attendance
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 md:py-8">
          {/* Class cards */}
          {/* Stack class cards on phones and restore two columns when space allows. */}
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {myClasses.map(cls => {
              const count = STUDENTS.filter(s => s.classId === cls.id && s.active).length;
              return (
                <button
                  key={cls.id}
                  onClick={() => handleSelectClass(cls.id)}
                  className="group min-h-11 rounded-2xl border p-5 text-left transition-all sm:p-6"
                  style={{ background: "var(--card)", borderColor: "var(--border)", cursor: "pointer" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                    style={{ background: `${cls.color}18` }}
                  >
                    <span style={{ fontSize: 28 }}>{cls.icon}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
                    {cls.name}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 12 }}>
                    {cls.day}s at {cls.time}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} style={{ color: cls.color }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: cls.color }}>{count} students</span>
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                      style={{ background: `${cls.color}18` }}
                    >
                      <ChevronRight size={14} style={{ color: cls.color }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Recent attendance history */}
          <div className="mt-8 max-w-2xl md:mt-10">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "var(--primary)", marginBottom: 16 }}>
              Recent Attendance
            </h2>
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              {["2026-05-31", "2026-05-24", "2026-05-17"].map((date, i) => (
                <div
                  key={date}
                  className="flex flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--muted)" }}>
                      <Clock size={15} style={{ color: "var(--muted-foreground)" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--foreground)" }}>
                        {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>First Communion · 5 students</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 12, fontWeight: 600, background: "#DCFCE7", color: "#166534" }}>
                      4 Present
                    </span>
                    <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 12, fontWeight: 600, background: "#FEE2E2", color: "#991B1B" }}>
                      1 Absent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Attendance taking view
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      {/* Allow attendance controls to wrap instead of overflowing the phone viewport. */}
      <header className="flex-shrink-0 border-b px-4 py-4 sm:px-6 md:px-8 md:py-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4 mb-1">
          <button
            onClick={() => { setSelectedClassId(null); setSubmitted(false); }}
            className="flex items-center gap-1.5 transition-colors"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 13 }}
          >
            <ArrowLeft size={14} />
            Back to Classes
          </button>
        </div>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 28 }}>{selectedClass?.icon}</span>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(20px, 5vw, 24px)", fontWeight: 700, color: "var(--primary)" }}>
                {selectedClass?.name}
              </h1>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
              {selectedClass?.teacher} · {selectedClass?.day}s at {selectedClass?.time}
            </p>
          </div>
          {/* Date picker */}
          <div className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 sm:w-auto sm:px-4" style={{ borderColor: "var(--border)", background: "var(--muted)" }}>
            <span style={{ fontSize: 13, color: "var(--muted-foreground)", fontWeight: 500 }}>Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => handleDateChange(e.target.value)}
              style={{ fontSize: 14, fontWeight: 500, border: "none", background: "transparent", color: "var(--foreground)", outline: "none" }}
            />
          </div>
        </div>

        {/* Summary pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ fontSize: 13, fontWeight: 600, background: "#DCFCE7", color: "#166534" }}>
            <CheckCircle2 size={13} />
            {presentCount} Present
          </span>
          <span className="px-3 py-1 rounded-full" style={{ fontSize: 13, fontWeight: 600, background: "#FEE2E2", color: "#991B1B" }}>
            {absentCount} Absent
          </span>
          <span className="px-3 py-1 rounded-full" style={{ fontSize: 13, color: "var(--muted-foreground)", background: "var(--muted)" }}>
            {classStudents.length} Total
          </span>
        </div>
      </header>

      {/* Submitted state */}
      {submitted ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#DCFCE7" }}>
            <CheckCircle2 size={40} style={{ color: "#16A34A" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>
            Attendance Submitted!
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted-foreground)" }}>
            {presentCount} present, {absentCount} absent — recorded for{" "}
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 px-6 py-2.5 rounded-xl border transition-colors"
            style={{ fontSize: 14, fontWeight: 500, background: "transparent", borderColor: "var(--border)", color: "var(--primary)", cursor: "pointer" }}
          >
            Edit Attendance
          </button>
        </div>
      ) : (
        <>
          {/* Student list */}
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 md:py-6">
            <div className="flex flex-col gap-3 max-w-xl">
              {classStudents.map(student => {
                const isPresent = attendance[student.id] ?? true;
                return (
                  <div
                    key={student.id}
                    className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border px-4 py-4 transition-all sm:flex-row sm:items-center sm:px-5"
                    style={{
                      background: "var(--card)",
                      borderColor: isPresent ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.2)",
                      borderWidth: 1.5,
                    }}
                  >
                    {/* Student info */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isPresent ? "#DCFCE7" : "#FEE2E2",
                          fontSize: 14,
                          fontWeight: 700,
                          color: isPresent ? "#16A34A" : "#DC2626",
                        }}
                      >
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 600, color: "var(--foreground)" }}>
                          {student.firstName} {student.lastName}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                          Grade {student.grade} · Parent: {student.parentName}
                        </p>
                      </div>
                    </div>

                    {/* Large toggle */}
                    <div className="flex items-center justify-end gap-3">
                      <span style={{ fontSize: 13, fontWeight: 600, color: isPresent ? "#16A34A" : "#DC2626", minWidth: 50, textAlign: "right" }}>
                        {isPresent ? "Present" : "Absent"}
                      </span>
                      <button
                        onClick={() => toggle(student.id)}
                        className="relative rounded-full transition-all flex-shrink-0"
                        style={{
                          width: 64,
                          height: 34,
                          background: isPresent ? "#16A34A" : "#E5E7EB",
                          border: "none",
                          cursor: "pointer",
                          boxShadow: isPresent ? "0 2px 8px rgba(22,163,74,0.4)" : "none",
                        }}
                        aria-label={`Mark ${student.firstName} ${isPresent ? "absent" : "present"}`}
                      >
                        <div
                          className="absolute top-1 rounded-full bg-white transition-all"
                          style={{
                            width: 26,
                            height: 26,
                            left: isPresent ? 36 : 4,
                            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                          }}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <div className="flex-shrink-0 border-t px-4 py-4 sm:px-6 md:px-8 md:py-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="max-w-xl">
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(27,58,92,0.3)",
                }}
              >
                <Send size={18} />
                Submit Attendance
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted-foreground)", marginTop: 8 }}>
                This will record attendance for {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
