import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { AdminDashboard } from "./components/AdminDashboard";
import { TeacherView } from "./components/TeacherView";

type View = "admin" | "teacher";

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */}
  const [view, setView] = useState<View>("admin");

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "var(--font-sans)", background: "var(--background)" }}
    >
      <Sidebar activeView={view} onViewChange={setView} activeClass={null} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {view === "admin" ? <AdminDashboard /> : <TeacherView />}
      </main>
    </div>
  );
}
