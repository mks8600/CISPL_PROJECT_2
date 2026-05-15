import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authApi, setToken, removeToken } from '@/lib/api/client';

const AuthContext = createContext(undefined);

function getPortalFromPath(pathname) {
  if (pathname.startsWith('/company/')) return 'company';
  if (pathname.startsWith('/vendor/')) return 'vendor';
  if (pathname.startsWith('/superadmin/')) return 'superadmin';
  return null;
}

function getInitialAuthStates() {
  if (typeof window === 'undefined') return {};
  
  const portals = ['company', 'vendor', 'superadmin'];
  const states = {};
  
  portals.forEach(p => {
    const token = localStorage.getItem(`cispl_token_${p}`);
    const user = localStorage.getItem(`cispl_user_${p}`);
    if (token && user) {
      try {
        states[p] = { user: JSON.parse(user), isAuthenticated: true };
      } catch {
        localStorage.removeItem(`cispl_token_${p}`);
        localStorage.removeItem(`cispl_user_${p}`);
      }
    }
  });
  return states;
}

export function AuthProvider({ children }) {
  const [authStates, setAuthStates] = useState(getInitialAuthStates());
  const location = useLocation();

  // Derive current portal from the URL path — this re-computes on every navigation
  const currentPortal = getPortalFromPath(location.pathname);
  const currentState = authStates[currentPortal] || { user: null, isAuthenticated: false };

  const login = async (rawEmail, rawPassword, portal, rawOrgCode = null) => {
    const email = rawEmail?.trim();
    const password = rawPassword?.trim();
    const orgCode = rawOrgCode?.trim().toUpperCase();

    try {
      const data = await authApi.login(email, password, portal, orgCode || undefined);

      // Store portal-specific JWT and user
      setToken(data.token, portal);
      localStorage.setItem(`cispl_user_${portal}`, JSON.stringify(data.user));

      setAuthStates(prev => ({
        ...prev,
        [portal]: { user: data.user, isAuthenticated: true }
      }));
      return true;
    } catch (err) {
      console.error(`${portal} login failed:`, err.message);
      return false;
    }
  };

  const logout = (portal) => {
    const p = portal || currentPortal;
    
    if (p) {
      removeToken(p);
      localStorage.removeItem(`cispl_user_${p}`);
      setAuthStates(prev => ({
        ...prev,
        [p]: { user: null, isAuthenticated: false }
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: currentState.user, 
      isAuthenticated: currentState.isAuthenticated, 
      currentPortal,
      login, 
      logout 
    }}>
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
