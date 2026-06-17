import React, { createContext, useContext, useState } from 'react';
import type { GameSyncPayload } from '../../shared/api-schemas/gameSync';
import { readNeonAuthToken } from './authTokenStorage';
import { sanitizeClientGameState } from './saveHydrationGuards';

interface User {
  id: string;
  username: string;
  gameState?: any;
}

function mergeGameStatePatch(prev: unknown, patch: GameSyncPayload): Record<string, unknown> {
  const base =
    prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...(prev as Record<string, unknown>) } : {};
  return { ...base, ...patch };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  syncGameState: (state: GameSyncPayload) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('neon_user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser) as User;
      if (parsed.gameState) {
        parsed.gameState = sanitizeClientGameState(parsed.gameState) ?? parsed.gameState;
      }
      return parsed;
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
    const user: User = {
      ...newUser,
      gameState: newUser.gameState
        ? sanitizeClientGameState(newUser.gameState) ?? newUser.gameState
        : newUser.gameState,
    };
    setToken(newToken);
    setUser(user);
    localStorage.setItem('neon_token', newToken);
    localStorage.setItem('neon_user', JSON.stringify(user));
  };

  const logout = () => {
    localStorage.removeItem('neon_token');
    localStorage.removeItem('neon_user');
    setToken(null);
    setUser(null);
    window.location.href = '/'; // Force redirect to root and reload
  };

  const syncGameState = async (state: GameSyncPayload) => {
    const authToken = readNeonAuthToken() ?? token;
    if (!authToken) return;
    try {
      const response = await fetch('/neon_v1/game/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
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
        if (response.status === 401 && (code === 'SYNC_INVALID_TOKEN' || code === 'SYNC_NO_TOKEN')) {
          logout();
        }
        return;
      }
      const updatedUser = {
        ...user!,
        gameState:
          sanitizeClientGameState(mergeGameStatePatch(user?.gameState, state)) ??
          mergeGameStatePatch(user?.gameState, state),
      };
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
