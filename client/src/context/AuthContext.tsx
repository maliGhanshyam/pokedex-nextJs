'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, AuthResponse, GuestUsage } from '@/services/api';

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  guestUsage: GuestUsage | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  signup: (email: string, password: string, name?: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshGuestUsage: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function applySession(
  response: AuthResponse,
  setUser: (u: User) => void,
  setGuestUsage: (u: GuestUsage | null) => void,
) {
  setUser(response.user);
  localStorage.setItem('user', JSON.stringify(response.user));
  setGuestUsage(response.user.isGuest ? (response.usage ?? null) : null);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [guestUsage, setGuestUsage] = useState<GuestUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      applySession(response, setUser, setGuestUsage);
    } catch {
      localStorage.removeItem('user');
      setUser(null);
      setGuestUsage(null);
    }
  }, []);

  const refreshGuestUsage = useCallback(async () => {
    if (!user?.isGuest) return;
    try {
      const response = await authApi.getMe();
      setGuestUsage(response.usage ?? null);
    } catch {
      /* ignore */
    }
  }, [user?.isGuest]);

  useEffect(() => {
    restoreSession().finally(() => setIsLoading(false));

    const handleUnauthorized = () => {
      setUser(null);
      setGuestUsage(null);
      localStorage.removeItem('user');
    };

    const handleUsageRefresh = () => {
      refreshGuestUsage();
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    window.addEventListener('guestUsageRefresh', handleUsageRefresh);
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
      window.removeEventListener('guestUsageRefresh', handleUsageRefresh);
    };
  }, [restoreSession, refreshGuestUsage]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    applySession(response, setUser, setGuestUsage);
  };

  const loginAsGuest = async () => {
    const response = await authApi.loginAsGuest();
    applySession(response, setUser, setGuestUsage);
  };

  const signup = async (email: string, password: string, name?: string, username?: string) => {
    const response = await authApi.signup({ email, password, name, username });
    applySession(response, setUser, setGuestUsage);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
      setGuestUsage(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest: !!user?.isGuest,
        guestUsage,
        login,
        loginAsGuest,
        signup,
        logout,
        refreshGuestUsage,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
