'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserProfile } from '@subguard/types';
import { RegisterInput, LoginInput } from '@subguard/validation';
import { api } from '@/lib/api-client';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/register'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = async () => {
    try {
      const res = await api.getSession();
      setUser(res.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = PUBLIC_PATHS.includes(pathname);
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isPublicPath) {
        if (!user.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (input: LoginInput) => {
    const res = await api.login(input);
    setUser(res.user);
    if (!res.user.onboardingCompleted) {
      router.push('/onboarding');
    } else {
      router.push('/');
    }
  };

  const register = async (input: RegisterInput) => {
    const res = await api.register(input);
    setUser(res.user);
    router.push('/onboarding');
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
