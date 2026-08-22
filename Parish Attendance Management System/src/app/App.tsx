import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { AccountNotReadyScreen } from "./components/AccountNotReadyView";
import { CatequistShell } from "./components/CatequistShell";
import { TeacherView } from "./components/TeacherView";
import { canTakeAttendance } from "./lib/types";

function AppContent() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "100dvh", background: "var(--background)", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}
      >
        Loading…
      </div>
    );
  }

  if (!session) return <LoginPage />;

  if (!canTakeAttendance(profile)) return <AccountNotReadyScreen />;

  return (
    <CatequistShell>
      <TeacherView />
    </CatequistShell>
  );
}

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */}
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
