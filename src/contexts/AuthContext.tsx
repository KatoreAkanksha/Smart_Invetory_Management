import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService, { AuthCredentials, SignupData } from '@/services/auth';
import type { User } from '@/types';

// Auth context interface
interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<User | null>;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  updateProfile: async () => null,
  clearError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        // Get the current authentication state from the service
        const authState = authService.getCurrentAuthState();
        
        // Update component state based on auth state
        setUser(authState.user);
        setIsAuthenticated(authState.isAuthenticated);
        setError(authState.error);
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize auth');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: AuthCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const authState = await authService.login(credentials);
      
      setUser(authState.user);
      setIsAuthenticated(authState.isAuthenticated);
      setError(authState.error);
      
      return authState.isAuthenticated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Signup function
  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const authState = await authService.signup(data);
      
      setUser(authState.user);
      setIsAuthenticated(authState.isAuthenticated);
      setError(authState.error);
      
      return authState.isAuthenticated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
      console.error('Signup error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    try {
      const authState = authService.logout();
      setUser(authState.user);
      setIsAuthenticated(authState.isAuthenticated);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<User | null> => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.updateProfile(user.id, updates);
      
      if (updatedUser) {
        setUser(updatedUser);
      } else {
        setError('Failed to update profile');
      }
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      console.error('Update profile error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
