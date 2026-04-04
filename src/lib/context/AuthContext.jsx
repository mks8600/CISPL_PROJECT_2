import React, { createContext, useContext, useState, useEffect } from 'react';
import { companyUsers, vendorUsers, mockCompanies, superAdminUser } from '@/lib/mock-data/users';

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
    // Ensure global vendors are seeded for immediate platform availability
    if (!localStorage.getItem('crystal_vendors')) {
      const seededVendors = vendorUsers.map((v, idx) => ({
        id: Date.now().toString() + idx,
        vendorNo: v.vendorId,
        vendorName: v.companyName,
        loginId: v.email,
        password: v.password,
        createdAt: new Date().toISOString()
      }));
      localStorage.setItem('crystal_vendors', JSON.stringify(seededVendors));
    }

    const initial = getInitialAuthState();
    setAuthState(initial);
    setIsLoading(false);
  }, []);

  const login = async (rawEmail, rawPassword, portal, rawOrgCode = null) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const email = rawEmail?.trim();
    const password = rawPassword?.trim();
    const orgCode = rawOrgCode?.trim().toUpperCase();

    if (portal === 'company') {
      if (!orgCode) return false;
      let dynamicCompanies = [];
      try {
        const storedCompanies = localStorage.getItem('crystal_companies');
        if (storedCompanies) {
          dynamicCompanies = JSON.parse(storedCompanies);
        } else {
          dynamicCompanies = mockCompanies;
        }
      } catch {
        dynamicCompanies = mockCompanies;
      }

      const company = dynamicCompanies.find(c => c.orgCode?.toUpperCase() === orgCode);
      if (!company) return false;
      // Load dynamic company users from storage
      let dynamicUsers = [];
      try {
        const storedUsers = localStorage.getItem('crystal_company_users');
        if (storedUsers) {
          dynamicUsers = JSON.parse(storedUsers);
        }
      } catch {
        // use empty array
      }

      let foundUser = dynamicUsers.find(
        (u) => 
          u.email?.toLowerCase() === email?.toLowerCase() && 
          u.password === password && 
          u.companyId === company.id
      );

      if (!foundUser) {
        // Fallback to mock users strictly binding to the original mock companyIds
        foundUser = companyUsers.find(
          (u) => 
            u.email?.toLowerCase() === email?.toLowerCase() && 
            u.password === password && 
            (u.companyId === company.id || (orgCode === 'CRYSTAL' && u.companyId === 'comp-1') || (orgCode === 'ACME' && u.companyId === 'comp-2'))
        );
      }

      if (foundUser) {
        const { password: _pwd, ...userWithoutPassword } = foundUser;
        const finalUser = { ...userWithoutPassword, companyName: company.name };
        setAuthState({ user: finalUser, isAuthenticated: true });
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: finalUser }));
        return true;
      }
    } else if (portal === 'vendor') {
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
        (v) => v.loginId?.trim().toLowerCase() === email?.toLowerCase() && v.password?.trim() === password
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
    } else if (portal === 'superadmin') {
      if (email === superAdminUser.email && password === superAdminUser.password) {
        const { password: _pwd, ...userWithoutPassword } = superAdminUser;
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
