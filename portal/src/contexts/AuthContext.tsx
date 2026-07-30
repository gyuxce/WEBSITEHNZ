import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel, Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, UserProgress } from "../lib/database.types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  progress: UserProgress | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadUserData = useCallback(async (userId: string) => {
    const [profileRes, progressRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_progress").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (progressRes.data) setProgress(progressRes.data);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return;
    await loadUserData(session.user.id);
  }, [loadUserData, session?.user.id]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadUserData(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadUserData(nextSession.user.id);
      } else {
        setProfile(null);
        setProgress(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadUserData]);

  // Real-time: refresh profile/progress whenever a row for the signed-in user
  // changes (e.g. the payment-verified trigger unlocks the language test).
  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel(`user_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_progress", filter: `user_id=eq.${userId}` },
        () => loadUserData(userId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        () => loadUserData(userId),
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [session?.user.id, loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProgress(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      progress,
      loading,
      signOut,
      refreshProfile,
    }),
    [session, profile, progress, loading, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
