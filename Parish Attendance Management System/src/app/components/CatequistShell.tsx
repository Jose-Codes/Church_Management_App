import { type ReactNode } from "react";
import { Cross, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Props = {
  children: ReactNode;
};

/** Mobile-first app shell for the Catequist flow: a slim top bar instead of
 * the desktop admin Sidebar, content filling the rest of the viewport. */
export function CatequistShell({ children }: Props) {
  const { profile, signOut } = useAuth();

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: "100dvh", background: "var(--background)", fontFamily: "var(--font-sans)" }}
    >
      <header
        className="flex items-center justify-between px-4 border-b flex-shrink-0"
        style={{
          background: "var(--primary)",
          borderColor: "var(--border)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          paddingBottom: 12,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <Cross size={16} color="#fff" />
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
              St. Michael's Parish
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }} className="truncate">
              {profile?.full_name ?? "Catequist"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          aria-label="Sign out"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 500 }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}
