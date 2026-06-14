"use client";

import type { AuthUserDto } from "@globalscout/shared";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SessionContextValue = {
  user: AuthUserDto | null;
  setUser: (user: AuthUserDto | null) => void;
  refreshSession: () => Promise<AuthUserDto | null>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: React.ReactNode;
  initialUser?: AuthUserDto | null;
};

export function SessionProvider({
  children,
  initialUser = null,
}: SessionProviderProps) {
  const [user, setUser] = useState<AuthUserDto | null>(initialUser);

  const refreshSession = useCallback(async () => {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
    });

    if (!response.ok) {
      setUser(null);
      return null;
    }

    const data = (await response.json()) as { user: AuthUserDto };
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      refreshSession,
    }),
    [user, refreshSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return context;
}
