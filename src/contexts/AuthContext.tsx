import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  accountStatus: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  accountStatus: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);

  const checkRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      setIsAdmin(data?.some((r) => r.role === "admin") ?? false);
    } catch {
      setIsAdmin(false);
    }
  };

  const checkAccountStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("user_id", userId)
        .single();
      setAccountStatus(data?.account_status ?? null);
    } catch {
      setAccountStatus(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(async () => {
            if (!mounted) return;
            await Promise.all([
              checkRole(session.user.id),
              checkAccountStatus(session.user.id),
            ]);
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setAccountStatus(null);
          setLoading(false);
        }
      }
    );

    // Then get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          checkRole(session.user.id),
          checkAccountStatus(session.user.id),
        ]).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, accountStatus, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
