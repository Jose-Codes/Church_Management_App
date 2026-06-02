import { X } from "lucide-react";
import { useState } from "react";
import type { Student } from "./mockData";
import { CLASSES } from "./mockData";

type Props = {
  student: Student | null;
  onClose: () => void;
  onSave: (s: Student) => void;
};

export function StudentModal({ student, onClose, onSave }: Props) {
  const isNew = !student?.id;
  const [form, setForm] = useState<Student>(
    student ?? {
      id: `s${Date.now()}`,
      firstName: "",
      lastName: "",
      dob: "",
      grade: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      classId: CLASSES[0].id,
      active: true,
    }
  );

  const field = (label: string, key: keyof Student, type = "text") => (
    <div className="flex flex-col gap-1">
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-lg px-3 py-2.5 border transition-colors"
        style={{
          fontSize: 14,
          background: "var(--input-background)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
          outline: "none",
        }}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,43,60,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600, color: "var(--primary)" }}>
              {isNew ? "Add New Student" : `Edit Student`}
            </h2>
            {!isNew && (
              <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                {form.firstName} {form.lastName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "var(--muted)", border: "none", cursor: "pointer" }}
          >
            <X size={16} color="var(--muted-foreground)" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {field("First Name", "firstName")}
          {field("Last Name", "lastName")}
          {field("Date of Birth", "dob", "date")}
          {field("Grade", "grade")}
          {field("Parent / Guardian", "parentName")}
          {field("Parent Phone", "parentPhone", "tel")}
          <div className="col-span-2">
            {field("Parent Email", "parentEmail", "email")}
          </div>

          {/* Class selector */}
          <div className="col-span-2 flex flex-col gap-1">
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Enrolled Class
            </label>
            <select
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
              className="w-full rounded-lg px-3 py-2.5 border"
              style={{ fontSize: 14, background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              {CLASSES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Active toggle */}
          <div className="col-span-2 flex items-center gap-3">
            <div
              className="relative w-12 h-6 rounded-full cursor-pointer transition-colors"
              style={{ background: form.active ? "var(--primary)" : "var(--switch-background)" }}
              onClick={() => setForm({ ...form, active: !form.active })}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: form.active ? 26 : 4 }}
              />
            </div>
            <span style={{ fontSize: 14, color: "var(--foreground)" }}>
              {form.active ? "Active enrollment" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border transition-colors"
            style={{ fontSize: 14, fontWeight: 500, background: "transparent", borderColor: "var(--border)", color: "var(--muted-foreground)", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="flex-1 py-2.5 rounded-xl transition-colors"
            style={{ fontSize: 14, fontWeight: 600, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer" }}
          >
            {isNew ? "Add Student" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
