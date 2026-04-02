'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { User, AuthResponse } from '@/types';
import { setTokens, clearTokens, getAccessToken } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const response = await api.get<User>('/users/me');
          setUser(response.data);
        }
      } catch (error) {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { accessToken, refreshToken, user } = response.data;
      setTokens(accessToken, refreshToken);
      setUser(user);
    } catch (error) {
      clearTokens();
      throw error;
    }
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string, phone: string) => {
      try {
        const response = await api.post<AuthResponse>('/auth/register', {
          fullName,
          email,
          password,
          phone,
        });

        const { accessToken, refreshToken, user } = response.data;
        setTokens(accessToken, refreshToken);
        setUser(user);
      } catch (error) {
        clearTokens();
        throw error;
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
