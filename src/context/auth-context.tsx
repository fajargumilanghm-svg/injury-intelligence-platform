"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "@/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  athleteId: string | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [athleteId, setAthleteId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);

    if (currentUser) {
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      setProfile(userProfile);
      setRole(userProfile?.role ?? null);

      const { data: athlete } = await supabase
        .from("athletes")
        .select("id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!athlete) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", currentUser.id)
          .single();

        if (profile) {
          const { data: newAthlete, error: createError } = await supabase
            .from("athletes")
            .insert({
              user_id: currentUser.id,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              age: 0,
              gender: "other",
              height: 0,
              weight: 0,
              sport: "",
              playing_position: "",
            })
            .select("id")
            .single();

          if (!createError && newAthlete) {
            setAthleteId(newAthlete.id);
          }
        }
      } else {
        setAthleteId(athlete.id);
      }
    } else {
      setProfile(null);
      setRole(null);
      setAthleteId(null);
    }
  }, [supabase]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await refreshProfile();
      setIsLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile();
      } else {
        setProfile(null);
        setRole(null);
        setAthleteId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, refreshProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      router.push("/dashboard");
      router.refresh();
    }
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (!error && data.user) {
      await supabase.from("user_profiles").insert({
        user_id: data.user.id,
        email,
        full_name: fullName,
        role,
      });
      router.push("/auth/login?message=Check your email to confirm your account");
      router.refresh();
    }
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        athleteId,
        role,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
