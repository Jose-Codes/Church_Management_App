import { useState } from "react";
import { Cross, LoaderCircle, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { requestPasswordReset, resendConfirmation } from "../lib/api";

type Mode = "signin" | "signup";

function isEmailNotConfirmed(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | undefined;
  return e?.code === "email_not_confirmed" || /email not confirmed/i.test(e?.message ?? "");
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setResetSent(false);
    setConfirmEmailSent(false);
    setNeedsConfirmation(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
      } else {
        const canSignInNow = await signUp(email.trim(), password, fullName.trim());
        if (canSignInNow) {
          await signIn(email.trim(), password);
        } else {
          setConfirmEmailSent(true);
        }
      }
    } catch (err) {
      if (mode === "signin" && isEmailNotConfirmed(err)) {
        setNeedsConfirmation(true);
        setError("Your account isn't confirmed yet — check your email for the confirmation link (spam folder too), or resend it below.");
      } else {
        setError(
          mode === "signin"
            ? "We couldn't sign you in. Check your email and password, or create an account below if you're new."
            : (err as { message?: string })?.message || "Couldn't create that account. It may already exist — try signing in instead."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email above first, then tap “Forgot password?” again.");
      return;
    }
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setResetSent(true);
    } catch {
      setError("Couldn't send a reset email right now. Please try again in a moment.");
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) return;
    setResending(true);
    try {
      await resendConfirmation(email.trim());
      setError("Confirmation email resent — check your inbox (and spam folder).");
    } catch {
      setError("Couldn't resend right now. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "var(--background)", fontFamily: "var(--font-sans)" }}
    >
      <div className="w-full flex flex-col items-center gap-3 mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--primary)" }}
        >
          <Cross size={30} color="#fff" />
        </div>
        <div className="text-center">
          <h1
            style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 700, color: "var(--primary)" }}
          >
            St. Michael's Parish
          </h1>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 2 }}>
            Catequist {mode === "signin" ? "Sign In" : "Account Setup"}
          </p>
        </div>
      </div>

      <div
        className="w-full rounded-2xl border overflow-hidden"
        style={{ maxWidth: 380, background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex" style={{ background: "var(--muted)" }}>
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className="flex-1 py-3"
              style={{
                fontSize: 13,
                fontWeight: 600,
                background: mode === m ? "var(--card)" : "transparent",
                color: mode === m ? "var(--primary)" : "var(--muted-foreground)",
                border: "none",
                borderBottom: mode === m ? "2px solid var(--primary)" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="fullName"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}
              >
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Maria Sanchez"
                  className="w-full rounded-xl pl-10 pr-3 py-3 border"
                  style={{ fontSize: 16, background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)", outline: "none" }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
              <input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl pl-10 pr-3 py-3 border"
                style={{ fontSize: 16, background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)", outline: "none" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl pl-10 pr-3 py-3 border"
                style={{ fontSize: 16, background: "var(--input-background)", borderColor: "var(--border)", color: "var(--foreground)", outline: "none" }}
              />
            </div>
          </div>

          {error && (
            <p role="alert" style={{ fontSize: 13, color: needsConfirmation ? "var(--accent)" : "var(--destructive)", lineHeight: 1.4 }}>
              {error}
            </p>
          )}
          {needsConfirmation && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={resending}
              style={{ fontSize: 13, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", textAlign: "center", textDecoration: "underline" }}
            >
              {resending ? "Resending…" : "Resend confirmation email"}
            </button>
          )}
          {resetSent && !error && (
            <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.4 }}>
              If that email has an account, a reset link is on its way.
            </p>
          )}
          {confirmEmailSent && !error && (
            <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.4 }}>
              Account created — check your email to confirm it, then sign in. Ask your parish office to enable Catequist
              access for your account once you're confirmed.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              cursor: submitting ? "default" : "pointer",
              fontSize: 16,
              fontWeight: 700,
              opacity: submitting ? 0.75 : 1,
            }}
          >
            {submitting && <LoaderCircle size={18} className="animate-spin" />}
            {submitting ? (mode === "signin" ? "Signing in…" : "Creating account…") : mode === "signin" ? "Sign In" : "Create Account"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              style={{ fontSize: 13, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", textAlign: "center", textDecoration: "underline" }}
            >
              Forgot password?
            </button>
          )}
        </form>
      </div>

      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 24, textAlign: "center", maxWidth: 320 }}>
        {mode === "signin"
          ? "New here? Use “Create Account” above, then ask your parish office to enable Catequist access."
          : "Creating an account only gets you signed in — your parish office still assigns which classes you teach."}
      </p>
    </div>
  );
}
