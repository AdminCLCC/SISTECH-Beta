'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredToken, getStoredUser, setStoredSession, clearStoredSession } from '@/lib/storage';
import { LoginResponse, me } from '@/lib/api';

type User = LoginResponse['user'];

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser<User>();

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setUser(storedUser);

    me(storedToken)
      .then((response) => {
        if (response.success && response.data) {
          setUser(response.data);
          setStoredSession(storedToken, response.data);
        } else {
          clearStoredSession();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isLoading,
    signIn: (nextToken, nextUser) => {
      setToken(nextToken);
      setUser(nextUser);
      setStoredSession(nextToken, nextUser);
    },
    signOut: () => {
      clearStoredSession();
      setToken(null);
      setUser(null);
    }
  }), [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
