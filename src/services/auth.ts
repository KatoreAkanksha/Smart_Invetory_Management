 import { User } from '@/models/User';

// Types for authentication
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignupData extends AuthCredentials {
  displayName: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Mock data for development (will be replaced with actual API calls)
const MOCK_USERS = [
  {
    id: '1',
    email: 'demo@example.com',
    password: 'password123', // In a real app, passwords would be hashed
    displayName: 'Demo User',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User',
    createdAt: new Date().toISOString(),
  },
];

// JWT helper functions
const generateToken = (user: Omit<User, 'password'>): string => {
  // In a real app, this would use a JWT library
  return btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.displayName,
    exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
  }));
};

const parseToken = (token: string): any => {
  try {
    return JSON.parse(atob(token));
  } catch (error) {
    return null;
  }
};

const isTokenValid = (token: string): boolean => {
  try {
    const parsed = parseToken(token);
    return parsed && parsed.exp > Date.now();
  } catch {
    return false;
  }
};

// Storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Helper functions for local storage
const saveToStorage = (key: string, value: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const getFromStorage = <T>(key: string): T | null => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  return null;
};

const clearStorage = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Authentication service with methods for login, signup, and user management
 */
class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: AuthCredentials): Promise<AuthState> {
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, this would be an API call
      const user = MOCK_USERS.find(u => 
        u.email === credentials.email && u.password === credentials.password
      );
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Create user without password
      const { password, ...userWithoutPassword } = user;
      
      // Generate token
      const token = generateToken(userWithoutPassword);
      
      // Save to local storage
      saveToStorage(TOKEN_KEY, token);
      saveToStorage(USER_KEY, userWithoutPassword);
      
      return {
        user: userWithoutPassword as User,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Sign up a new user
   */
  async signup(data: SignupData): Promise<AuthState> {
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if user already exists
      if (MOCK_USERS.some(u => u.email === data.email)) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser = {
        id: String(MOCK_USERS.length + 1),
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.displayName)}`,
        createdAt: new Date().toISOString(),
      };
      
      // In a real app, this would be an API call
      MOCK_USERS.push(newUser);
      
      // Create user without password
      const { password, ...userWithoutPassword } = newUser;
      
      // Generate token
      const token = generateToken(userWithoutPassword);
      
      // Save to local storage
      saveToStorage(TOKEN_KEY, token);
      saveToStorage(USER_KEY, userWithoutPassword);
      
      return {
        user: userWithoutPassword as User,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    }
  }

  /**
   * Logout the current user
   */
  logout(): AuthState {
    clearStorage();
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  /**
   * Get current authentication state
   */
  getCurrentAuthState(): AuthState {
    const token = getFromStorage<string>(TOKEN_KEY);
    const user = getFromStorage<User>(USER_KEY);
    
    if (token && user && isTokenValid(token)) {
      return {
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    }
    
    // If token is invalid, clear storage
    if (token || user) {
      clearStorage();
    }
    
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  }

  /**
   * Get the current user (to maintain compatibility with AuthContext)
   * This function is called by AuthContext.tsx
   */
  getCurrentUser(): User | null {
    const authState = this.getCurrentAuthState();
    return authState.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, this would be an API call
      const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // Update user
      MOCK_USERS[userIndex] = {
        ...MOCK_USERS[userIndex],
        ...updates,
      };
      
      // Create user without password
      const { password, ...userWithoutPassword } = MOCK_USERS[userIndex];
      
      // Update local storage
      saveToStorage(USER_KEY, userWithoutPassword);
      
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Update profile error:', error);
      return null;
    }
  }

  /**
   * Check if a user is authenticated
   */
  isAuthenticated(): boolean {
    const token = getFromStorage<string>(TOKEN_KEY);
    return token !== null && isTokenValid(token);
  }

  /**
   * Get authenticated user
   */
  getUser(): User | null {
    return getFromStorage<User>(USER_KEY);
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return getFromStorage<string>(TOKEN_KEY);
  }
}

// Create and export the authentication service
const authService = new AuthService();
export default authService;
