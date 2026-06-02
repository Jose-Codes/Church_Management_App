import { useState } from "react";
import { Search, Plus, Users, Edit2, Trash2, ChevronDown, Calendar } from "lucide-react";
import type { Student } from "./mockData";
import { CLASSES, STUDENTS } from "./mockData";
import { StudentModal } from "./StudentModal";

export function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState("2026-05-31");

  const filtered = students.filter(s => {
    const matchClass = !selectedClass || s.classId === selectedClass;
    const q = search.toLowerCase();
    const matchSearch = !q || `${s.firstName} ${s.lastName} ${s.parentName} ${s.parentEmail}`.toLowerCase().includes(q);
    return matchClass && matchSearch;
  });

  const handleSave = (s: Student) => {
    setStudents(prev => {
      const exists = prev.find(x => x.id === s.id);
      return exists ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev];
    });
  };

  const handleDelete = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const classOf = (id: string) => CLASSES.find(c => c.id === id);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="px-8 py-5 border-b flex items-center justify-between flex-shrink-0" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 700, color: "var(--primary)", lineHeight: 1.2 }}>
            Parish Admin Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
            St. Michael's Faith Formation — {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setEditingStudent(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
          style={{ background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
        >
          <Plus size={16} />
          Add Student
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-7">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Students" value={students.filter(s => s.active).length} icon={<Users size={20} />} color="var(--primary)" />
          <StatCard label="Active Classes" value={CLASSES.length} icon={<span style={{ fontSize: 18 }}>📚</span>} color="#4A7FA5" />
          <StatCard label="This Week" value="142" sub="attendance entries" icon={<span style={{ fontSize: 18 }}>✅</span>} color="#6BAA75" />
          <StatCard label="Upcoming Events" value="3" sub="this month" icon={<span style={{ fontSize: 18 }}>📅</span>} color="var(--accent)" />
        </div>

        {/* Classes grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "var(--primary)" }}>
              Active Classes
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
              <Calendar size={14} style={{ color: "var(--muted-foreground)" }} />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ fontSize: 13, border: "none", background: "transparent", color: "var(--foreground)", outline: "none" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {CLASSES.map(cls => {
              const count = students.filter(s => s.classId === cls.id && s.active).length;
              const isActive = selectedClass === cls.id;
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(isActive ? null : cls.id)}
                  className="text-left rounded-2xl p-5 border transition-all"
                  style={{
                    background: isActive ? cls.color : "var(--card)",
                    borderColor: isActive ? cls.color : "var(--border)",
                    cursor: "pointer",
                    boxShadow: isActive ? `0 4px 20px ${cls.color}40` : "none",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span style={{ fontSize: 28 }}>{cls.icon}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: isActive ? "rgba(255,255,255,0.25)" : `${cls.color}18`, color: isActive ? "#fff" : cls.color }}
                    >
                      {cls.day}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: isActive ? "#fff" : "var(--primary)", marginBottom: 2 }}>
                    {cls.name}
                  </h3>
                  <p style={{ fontSize: 12, color: isActive ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)", marginBottom: 8 }}>
                    {cls.teacher} · {cls.time}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} style={{ color: isActive ? "rgba(255,255,255,0.7)" : cls.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#fff" : cls.color }}>{count}</span>
                    <span style={{ fontSize: 12, color: isActive ? "rgba(255,255,255,0.65)" : "var(--muted-foreground)" }}>students</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Student table */}
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600, color: "var(--primary)", flex: 1 }}>
              {selectedClass ? `${classOf(selectedClass)?.name} — Roster` : "All Students"}
            </h2>
            {selectedClass && (
              <button
                onClick={() => setSelectedClass(null)}
                style={{ fontSize: 13, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Clear filter
              </button>
            )}
            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
              <input
                placeholder="Search students…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border"
                style={{ fontSize: 14, background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", outline: "none", width: 220 }}
              />
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
            {/* Table header */}
            <div className="grid px-5 py-3 border-b" style={{ gridTemplateColumns: "1.6fr 1fr 1.2fr 1fr 1fr 80px", borderColor: "var(--border)", background: "var(--muted)" }}>
              {["Student", "Grade", "Class", "Parent", "Contact", ""].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {h}
                </div>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
                No students found
              </div>
            ) : (
              filtered.map((s, i) => {
                const cls = classOf(s.classId);
                return (
                  <div
                    key={s.id}
                    className="grid px-5 py-3.5 items-center transition-colors hover:bg-opacity-50"
                    style={{
                      gridTemplateColumns: "1.6fr 1fr 1.2fr 1fr 1fr 80px",
                      borderTop: i > 0 ? `1px solid var(--border)` : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: cls?.color ? `${cls.color}22` : "var(--muted)", fontSize: 13, fontWeight: 700, color: cls?.color ?? "var(--primary)" }}
                      >
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{s.firstName} {s.lastName}</p>
                        <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>DOB: {s.dob}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: "var(--foreground)" }}>{s.grade}</span>
                    <div>
                      {cls && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ fontSize: 12, fontWeight: 500, background: `${cls.color}18`, color: cls.color }}
                        >
                          {cls.icon} {cls.name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 13, color: "var(--foreground)" }}>{s.parentName}</span>
                    <div>
                      <p style={{ fontSize: 12, color: "var(--foreground)" }}>{s.parentPhone}</p>
                      <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{s.parentEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingStudent(s)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "var(--muted)", border: "none", cursor: "pointer" }}
                      >
                        <Edit2 size={13} style={{ color: "var(--primary)" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                        style={{ background: "#FEE2E2", border: "none", cursor: "pointer" }}
                      >
                        <Trash2 size={13} style={{ color: "var(--destructive)" }} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8, textAlign: "right" }}>
            Showing {filtered.length} of {students.length} students
          </p>
        </section>
      </div>

      {/* Modal */}
      {editingStudent !== undefined && (
        <StudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: number | string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)", lineHeight: 1, fontFamily: "var(--font-serif)" }}>{value}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{sub}</p>}
    </div>
  );
}
