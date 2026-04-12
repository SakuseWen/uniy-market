import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  userID: string;
  email: string;
  name: string;
  profileImage?: string;
  bio?: string;
  eduVerified?: boolean;
  eduEmail?: string;
  isVerified: boolean;
  isAdmin: boolean;
  preferredLanguage: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化：从 sessionStorage 恢复认证状态，并从后端刷新最新用户信息
  useEffect(() => {
    const savedToken = sessionStorage.getItem('authToken');
    const savedUser = sessionStorage.getItem('authUser');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser);
        setUser(parsed);

        // Refresh user info from backend
        fetch('http://localhost:3000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${savedToken}` },
        })
          .then(r => r.json())
          .then(data => {
            if (data.success && data.data) {
              setUser(data.data);
              sessionStorage.setItem('authUser', JSON.stringify(data.data));
            }
          })
          .catch(() => {});
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorCode = errorData?.error?.code || 'LOGIN_FAILED';
        throw new Error(errorCode);
      }

      const data = await response.json();
      const { token: newToken, user: newUser } = data.data;

      setToken(newToken);
      setUser(newUser);
      sessionStorage.setItem('authToken', newToken);
      sessionStorage.setItem('authUser', JSON.stringify(newUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('authUser');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    sessionStorage.setItem('authUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user && !!token,
      }}
    >
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
