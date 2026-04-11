import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setToken, removeToken } from '@/lib/api/client';

const TOKEN_KEY = 'cispl_token';

const AuthContext = createContext(undefined);

function getInitialAuthState() {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  // If a token exists, we assume authenticated; the /me call will validate
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem('cispl_user');
  if (token && storedUser) {
    try {
      return { user: JSON.parse(storedUser), isAuthenticated: true };
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('cispl_user');
    }
  }
  return { user: null, isAuthenticated: false };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({ user: null, isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate auth state from stored token on mount
  useEffect(() => {
    const initial = getInitialAuthState();
    setAuthState(initial);
    setIsLoading(false);
  }, []);

  const login = async (rawEmail, rawPassword, portal, rawOrgCode = null) => {
    const email = rawEmail?.trim();
    const password = rawPassword?.trim();
    const orgCode = rawOrgCode?.trim().toUpperCase();

    try {
      const data = await authApi.login(email, password, portal, orgCode || undefined);

      // Store JWT token and user data
      setToken(data.token);
      localStorage.setItem('cispl_user', JSON.stringify(data.user));

      setAuthState({ user: data.user, isAuthenticated: true });
      return true;
    } catch (err) {
      console.error('Login failed:', err.message);
      return false;
    }
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    removeToken();
    localStorage.removeItem('cispl_user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user: authState.user, isAuthenticated: authState.isAuthenticated, login, logout }}>
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
