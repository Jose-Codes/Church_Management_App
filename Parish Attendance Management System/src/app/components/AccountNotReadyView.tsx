import { type ReactNode } from "react";
import { ClipboardList, Clock, Cross, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function firstName(fullName: string | null | undefined): string | null {
  const name = fullName?.trim().split(/\s+/)[0];
  return name ? name : null;
}

/** Centered card explaining why there's nothing to do yet. Used both for the
 * whole-app gate and for the empty "My Classes" list. */
export function AccountNotReadyNotice({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center max-w-md mx-auto w-full px-6 py-10">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--muted)", color: "var(--primary)" }}
      >
        {icon}
      </div>

      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 20,
          fontWeight: 700,
          color: "var(--primary)",
          marginTop: 20,
        }}
      >
        {title}
      </h2>

      <div
        className="flex flex-col gap-3"
        style={{ fontSize: 14, lineHeight: 1.55, color: "var(--muted-foreground)", marginTop: 12 }}
      >
        {children}
      </div>

      {action && <div className="mt-7 w-full">{action}</div>}
    </div>
  );
}

/** Shown to catechists whose account is fine but who haven't been put on a
 * class roster yet. Rendered inside the app shell, which already has its own
 * Sign Out button. */
export function NoClassesAssignedNotice() {
  return (
    <AccountNotReadyNotice icon={<ClipboardList size={28} />} title="You're not assigned to a class yet">
      <p>
        Your account is ready to go — the parish office just hasn't added you to a class. Once they do, your classes will
        show up right here.
      </p>
      <p>Let the office know which class you're helping with, and check back after they've set it up.</p>
    </AccountNotReadyNotice>
  );
}

/** Full-screen gate for anyone who signed up but hasn't been made a catechist
 * by the parish office. Replaces the app entirely, so it carries its own
 * Sign Out button. */
export function AccountNotReadyScreen() {
  const { profile, signOut } = useAuth();
  const name = firstName(profile?.full_name);

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: "100dvh", background: "var(--background)", fontFamily: "var(--font-sans)" }}
    >
      <header
        className="flex items-center gap-2.5 px-4 border-b flex-shrink-0"
        style={{
          background: "var(--primary)",
          borderColor: "var(--border)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          paddingBottom: 12,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Cross size={16} color="#fff" />
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>St. Michael's Parish</p>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <AccountNotReadyNotice
          icon={<Clock size={28} />}
          title="Your account isn't ready yet"
          action={
            <button
              onClick={() => signOut()}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2"
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          }
        >
          <p>
            {name ? `Thanks for signing up, ${name}. ` : "Thanks for signing up. "}
            Before you can take attendance, someone at the parish office needs to add you as a catechist and put you on
            a class.
          </p>
          <p>
            Give the office a call or stop by after Mass and we'll get you set up. Sign back in once they've confirmed
            it, and your classes will be waiting for you.
          </p>
        </AccountNotReadyNotice>
      </main>
    </div>
  );
}
