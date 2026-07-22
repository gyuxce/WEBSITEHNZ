import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "../lib/auth-client";
import { apiFetch } from "../lib/api";
import type { Profile, UserProgress } from "../lib/database.types";

export type AppUser = {
  id: string;
  email: string;
  name: string;
};

interface AuthContextValue {
  session: { user: AppUser } | null;
  user: AppUser | null;
  profile: Profile | null;
  progress: UserProgress | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await apiFetch<{
        user: AppUser;
        profile: Profile | null;
        progress: UserProgress | null;
      }>("/me");
      setUser(me.user);
      setProfile(me.profile);
      setProgress(me.progress);
    } catch {
      setUser(null);
      setProfile(null);
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const { data } = await authClient.getSession();
        if (cancelled) return;
        if (data?.session && data.user) {
          await refreshProfile();
        } else {
          setUser(null);
          setProfile(null);
          setProgress(null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setProfile(null);
          setProgress(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
    setUser(null);
    setProfile(null);
    setProgress(null);
  }, []);

  const value = useMemo(
    () => ({
      session: user ? { user } : null,
      user,
      profile,
      progress,
      loading,
      signOut,
      refreshProfile,
    }),
    [user, profile, progress, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
