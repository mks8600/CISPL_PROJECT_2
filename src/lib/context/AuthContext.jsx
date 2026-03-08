import React, { createContext, useContext, useState, useEffect } from 'react';
import { companyUsers, vendorUsers } from '@/lib/mock-data/users';

const AUTH_STORAGE_KEY = 'crystal_auth';

const AuthContext = createContext(undefined);

function getInitialAuthState() {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return { user: parsed.user, isAuthenticated: true };
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
  return { user: null, isAuthenticated: false };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({ user: null, isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount - this is the intended pattern for hydration
  useEffect(() => {
    const initial = getInitialAuthState();
    setAuthState(initial);
    setIsLoading(false);
  }, []);

  const login = async (email, password, portal) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (portal === 'company') {
      const foundUser = companyUsers.find(
        (u) => u.email === email && u.password === password
      );
      if (foundUser) {
        const { password: _pwd, ...userWithoutPassword } = foundUser;
        setAuthState({ user: userWithoutPassword, isAuthenticated: true });
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userWithoutPassword }));
        return true;
      }
    } else {
      // Dynamic Vendor Login
      let dynamicVendors = [];
      try {
        const storedVendors = localStorage.getItem('crystal_vendors');
        if (storedVendors) {
          dynamicVendors = JSON.parse(storedVendors);
        }
      } catch {
        console.error('Failed to parse crystal_vendors');
      }

      const foundDynamicVendor = dynamicVendors.find(
        (v) => v.loginId === email && v.password === password
      );

      if (foundDynamicVendor) {
        const user = {
          id: foundDynamicVendor.id,
          name: foundDynamicVendor.vendorName,
          email: foundDynamicVendor.loginId,
          portalType: 'vendor',
          vendorId: foundDynamicVendor.vendorNo
        };
        setAuthState({ user, isAuthenticated: true });
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
        return true;
      }

      // Fallback to mock vendor users for convenience or testing
      const foundMockUser = vendorUsers.find(
        (u) => u.email === email && u.password === password
      );
      if (foundMockUser) {
        const { password: _pwd, ...userWithoutPassword } = foundMockUser;
        setAuthState({ user: userWithoutPassword, isAuthenticated: true });
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userWithoutPassword }));
        return true;
      }
    }

    return false;
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
