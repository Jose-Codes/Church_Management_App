import { useState } from "react";
import { Cross, Menu } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { AdminDashboard } from "./components/AdminDashboard";
import { TeacherView } from "./components/TeacherView";

type View = "admin" | "teacher";

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */}
  const [view, setView] = useState<View>("admin");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className="flex h-dvh min-w-0 overflow-hidden"
      style={{ fontFamily: "var(--font-sans)", background: "var(--background)" }}
    >
      {/* Keep the full navigation visible on desktop while preserving the existing layout. */}
      <Sidebar activeView={view} onViewChange={setView} activeClass={null} className="hidden md:flex" />

      {/* Present a compact branded header instead of a fixed-width sidebar on phones. */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:hidden" style={{ background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--sidebar-primary)" }}>
            <Cross size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 15, lineHeight: 1.2, color: "#fff" }}>St. Michael's Parish</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Faith Formation</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" }}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Slide navigation over the page so mobile content always keeps the full viewport width. */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full"
            style={{ background: "rgba(15, 23, 42, 0.55)", border: "none" }}
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close navigation menu"
          />
          <Sidebar
            activeView={view}
            onViewChange={nextView => {
              setView(nextView);
              setIsMenuOpen(false);
            }}
            activeClass={null}
            className="relative z-10 flex shadow-2xl"
            mobile
            onClose={() => setIsMenuOpen(false)}
          />
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-hidden pt-16 md:pt-0">
        {view === "admin" ? <AdminDashboard /> : <TeacherView />}
      </main>
    </div>
  );
}
