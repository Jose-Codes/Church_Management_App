import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getMyProfile, getSession, onAuthStateChange, signIn, signOut, signUp } from "../lib/api";
import type { Profile } from "../lib/types";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Returns true if the new account can sign in immediately, false if it
   * still needs an email-confirmation click first. */
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function applySession(s: Session | null) {
      setSession(s);
      if (!s?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const p = await getMyProfile(s.user.id);
        if (!cancelled) setProfile(p);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    getSession()
      .then((s) => !cancelled && applySession(s))
      .catch(() => !cancelled && setLoading(false));

    const { data: subscription } = onAuthStateChange((_event, s) => {
      applySession(s);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    session,
    profile,
    loading,
    signIn: async (email, password) => {
      await signIn(email, password);
    },
    signUp: async (email, password, fullName) => {
      const data = await signUp(email, password, fullName);
      return Boolean(data.session);
    },
    signOut: async () => {
      await signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
