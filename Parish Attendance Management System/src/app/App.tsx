import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { CatequistShell } from "./components/CatequistShell";
import { TeacherView } from "./components/TeacherView";

function AppContent() {
  const { session, loading } = useAuth();

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
