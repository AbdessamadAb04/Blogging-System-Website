import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import type { AuthStatus } from '../services/authService';

interface AuthContextType extends AuthStatus {
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ isAuthenticated: false });
  const [loading, setLoading] = useState(true);

  const refreshAuthStatus = async () => {
    try {
      setLoading(true);
      const status = await authService.getAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Error refreshing auth status:', error);
      setAuthStatus({ isAuthenticated: false });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setAuthStatus({ isAuthenticated: false });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    refreshAuthStatus();
  }, []);

  const value: AuthContextType = {
    ...authStatus,
    loading,
    signOut,
    refreshAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};