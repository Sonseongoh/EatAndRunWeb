"use client";

import { Provider, User } from "@supabase/supabase-js";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { migrateGuestHistoryToAccount } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type OAuthProvider = Extract<Provider, "google" | "kakao">;

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithOtp: (email: string) => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const migratedForUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (migratedForUserIdRef.current === user.id) return;
    migratedForUserIdRef.current = user.id;

    void migrateGuestHistoryToAccount().catch(() => {
      // 로그인 자체를 막지 않기 위해 이관 실패는 조용히 무시
    });
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      async signInWithOtp(email: string) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          throw new Error("로그인 설정이 비어 있습니다. NEXT_PUBLIC_SUPABASE 값을 확인해주세요.");
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        if (error) throw error;
      },
      async signInWithOAuth(provider) {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          throw new Error("로그인 설정이 비어 있습니다. NEXT_PUBLIC_SUPABASE 값을 확인해주세요.");
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/login`
          }
        });
        if (error) throw error;
      },
      async signOut() {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    }),
    [isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

