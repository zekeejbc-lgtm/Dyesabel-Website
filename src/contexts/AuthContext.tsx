import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, SESSION_TOKEN_KEY, USER_STORAGE_KEY } from '../types';
import { AuthService } from '../services/DriveService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkPermission: (requiredRole: UserRole, chapterId?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (token) {
        try {
          const result = await AuthService.validateSession(token);
          if (result.success && result.user) {
            setUser(result.user);
          } else {
            logout(); // Token expired or invalid
          }
        } catch (error) {
          console.error("Session validation failed", error);
          logout(); // Clear session on error
        }
      }
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await AuthService.login(username, password);

      if (result.success && result.user && result.sessionToken) {
        setUser(result.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
        localStorage.setItem(SESSION_TOKEN_KEY, result.sessionToken);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: result.error || 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      const userFriendlyError = errorMsg.includes('fetch') || errorMsg.includes('Network')
        ? 'Unable to reach server. Please check your internet connection and try again.'
        : 'Connection failed. Please try again.';
      setIsLoading(false);
      return { success: false, error: userFriendlyError };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  };

  const checkPermission = (requiredRole: UserRole | null, chapterId?: string): boolean => {
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