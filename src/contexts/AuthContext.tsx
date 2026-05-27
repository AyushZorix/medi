import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getSession,
  getUserDisplayName,
  getUserInitials,
  type User,
  type UserRole,
  signOut as apiSignOut,
} from "@/lib/auth";

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  displayName: string;
  initials: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getSession()
      .then((nextUser) => {
        if (mounted) {
          setUser(nextUser);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const nextUser = await getSession();
      setUser(nextUser);
    } finally {
      setLoading(false);
    }
  }, []);

  const role = user?.role ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      displayName: user ? getUserDisplayName(user) : "",
      initials: user ? getUserInitials(user) : "",
      loading,
      signOut,
      refreshSession,
    }),
    [user, role, loading, signOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
