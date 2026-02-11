import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'chapter_head' | 'editor' | null;

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  chapterId?: string; // For chapter heads - which chapter they manage
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkPermission: (requiredRole: UserRole, chapterId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google Apps Script Web App URL - Replace with your deployed GAS URL
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbx6jSvrQOC8dh9rtZ9Ort368Q2a--aSEcx7mmWNTfdonGWQglcNPGxM3HLOndS4Mt1ahQ/exec';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
  const checkSession = async () => {
    const token = localStorage.getItem('dyesabel_session');
    if (token) {
      try {
        const response = await fetch(GAS_API_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'validateSession', sessionToken: token })
        });
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        } else {
          logout(); // Token expired or invalid
        }
      } catch (error) {
        console.error("Session validation failed", error);
      }
    }
    setIsLoading(false);
  };
  checkSession();
}, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
  setIsLoading(true);
  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      // REMOVED: mode: 'cors' and 'Content-Type' header
      // This allows the browser to bypass the preflight check
      body: JSON.stringify({
        action: 'login',
        username,
        password,
      }),
    });

    const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('dyesabel_user', JSON.stringify(data.user));
        localStorage.setItem('dyesabel_session', data.sessionToken);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: data.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      const corsError = errorMsg.includes('CORS') || errorMsg.includes('fetch') ? 
        'CORS error: Unable to connect to the server. Please ensure the GAS URL is correct and deployed with "Anyone" access.' : 
        errorMsg;
      setIsLoading(false);
      return { success: false, error: corsError };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dyesabel_user');
    localStorage.removeItem('dyesabel_session');
  };

  const checkPermission = (requiredRole: UserRole, chapterId?: string): boolean => {
    if (!user) return false;

    // Admin has access to everything
    if (user.role === 'admin') return true;

    // Editor can only edit landing page
    if (user.role === 'editor' && requiredRole === 'editor') return true;

    // Chapter head can edit their specific chapter
    if (user.role === 'chapter_head' && requiredRole === 'chapter_head') {
      if (chapterId && user.chapterId === chapterId) return true;
    }

    return false;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};