import { LayoutDashboard, Users, ClipboardList, BookOpen, ChevronRight, Cross, X } from "lucide-react";

type View = "admin" | "teacher";

type Props = {
  activeView: View;
  onViewChange: (v: View) => void;
  activeClass: string | null;
  className?: string;
  mobile?: boolean;
  onClose?: () => void;
};

export function Sidebar({ activeView, onViewChange, activeClass, className = "", mobile = false, onClose }: Props) {
  return (
    <aside
      className={`h-full flex-col ${className}`}
      style={{ background: "var(--sidebar)", color: "var(--sidebar-foreground)", width: mobile ? "min(84vw, 320px)" : 260 }}
    >
      {/* Logo / Parish Name */}
      <div className="px-6 py-6 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--sidebar-primary)" }}
          >
            <Cross size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 15, lineHeight: 1.2, color: "#fff" }}>
              St. Michael's Parish
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>
              Faith Formation
            </p>
          </div>
          {/* Give touch users an obvious way to dismiss the navigation drawer. */}
          {mobile && (
            <button
              type="button"
              onClick={onClose}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" }}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Role switcher */}
      <div className="px-4 pt-5 pb-3">
        <p style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 8 }}>
          Role
        </p>
        <div className="flex rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          {(["admin", "teacher"] as View[]).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className="flex-1 py-2 transition-colors"
              style={{
                fontSize: 13,
                fontWeight: activeView === v ? 600 : 400,
                background: activeView === v ? "var(--sidebar-primary)" : "transparent",
                color: activeView === v ? "#fff" : "rgba(255,255,255,0.55)",
                borderRadius: 8,
                cursor: "pointer",
                border: "none",
              }}
            >
              {v === "admin" ? "Admin" : "Teacher"}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {activeView === "admin" ? (
          <>
            <NavSection label="Management" />
            <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active />
            <NavItem icon={<Users size={16} />} label="Students" />
            <NavItem icon={<BookOpen size={16} />} label="Classes" />
            <NavItem icon={<ClipboardList size={16} />} label="Attendance Records" />
          </>
        ) : (
          <>
            <NavSection label="My Classes" />
            <NavItem icon={<BookOpen size={16} />} label="First Communion" active={activeClass === "c1"} />
            <NavItem icon={<BookOpen size={16} />} label="Children's Liturgy" active={activeClass === "c6"} />
            <NavSection label="Quick Links" />
            <NavItem icon={<ClipboardList size={16} />} label="Attendance History" />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--sidebar-primary)", fontSize: 13, fontWeight: 600, color: "#fff" }}
          >
            N
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", lineHeight: 1.2 }}>Nancy Mitchell</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Parish Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", padding: "14px 10px 6px" }}>
      {label}
    </p>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
      style={{
        background: active ? "rgba(201,148,58,0.2)" : "transparent",
        color: active ? "var(--sidebar-primary)" : "rgba(255,255,255,0.65)",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ color: active ? "var(--sidebar-primary)" : "rgba(255,255,255,0.45)" }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{label}</span>
      {active && <ChevronRight size={14} className="ml-auto" style={{ color: "var(--sidebar-primary)" }} />}
    </button>
  );
}
