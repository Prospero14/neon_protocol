import React, { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  username: string;
  gameState?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  syncGameState: (state: any) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('neon_user');
      return savedUser ? (JSON.parse(savedUser) as User) : null;
    } catch {
      try {
        localStorage.removeItem('neon_user');
        localStorage.removeItem('neon_token');
      } catch {
        /* ignore */
      }
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('neon_token'));
  const [isLoading] = useState(false);


  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('neon_token', newToken);
    localStorage.setItem('neon_user', JSON.stringify(newUser));
  };

  const logout = () => {
    localStorage.removeItem('neon_token');
    localStorage.removeItem('neon_user');
    setToken(null);
    setUser(null);
    window.location.href = '/'; // Force redirect to root and reload
  };

  const syncGameState = async (state: any) => {
    if (!token) return;
    try {
      const response = await fetch('/neon_v1/game/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(state)
      });
      if (!response.ok) {
        let errBody: { error?: unknown; code?: unknown } = {};
        try {
          const ct = response.headers.get('content-type');
          if (ct?.includes('application/json')) errBody = await response.json();
        } catch {
          /* ignore */
        }
        const msg =
          typeof errBody.error === 'string' && errBody.error.trim()
            ? errBody.error
            : response.statusText || 'Sync failed';
        const code = typeof errBody.code === 'string' ? errBody.code : '';
        console.error('Failed to sync game state:', msg, 'HTTP', response.status, code || '(no code)');
        // Only hard-logout on confirmed invalid token.
        if (response.status === 401 && code === 'SYNC_INVALID_TOKEN') {
          logout();
        }
        return;
      }
      const updatedUser = { ...user!, gameState: state };
      setUser(updatedUser);
      localStorage.setItem('neon_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to sync game state:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, syncGameState, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
