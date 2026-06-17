import { useCallback, useEffect, useState } from 'react';
import { readNeonAuthToken } from '../authTokenStorage';
import { nriCreateSession, nriJoinSession, parseNriInviteFromHash } from '../nriApi';
import {
  markNriInviteGuestFromLanding,
  readLandingNriInviteCode,
  readNriGuestInviteCode,
} from '../nriFeatureFlags';
import type { SessionMode } from '../sessionMode';

export type NriViewType = 'NRI_LOBBY' | 'SESSION_GATE' | 'NEON_SERVICES';

type UseNriSessionDeps = {
  userId: string | undefined;
  hydrationReady: boolean;
  setSessionMode: (mode: SessionMode) => void;
  setCurrentView: (view: NriViewType | string) => void;
  /** Полный merge solo-сохранения (enter/leave/auto-join). */
  syncGame: (overrides?: Record<string, unknown>) => void | Promise<void>;
};

export function parseNriCodeFromGameState(gs: Record<string, unknown>): string | null {
  const raw = gs.nriInviteCode;
  return typeof raw === 'string' && raw.startsWith('NRI-') ? raw : null;
}

export function useNriSession({
  userId,
  hydrationReady,
  setSessionMode,
  setCurrentView,
  syncGame,
}: UseNriSessionDeps) {
  const [nriInviteCode, setNriInviteCode] = useState<string | null>(null);
  const [pendingNriInvite, setPendingNriInvite] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    markNriInviteGuestFromLanding();
    return readLandingNriInviteCode() ?? parseNriInviteFromHash(window.location.hash);
  });

  const enterNriLobby = useCallback(
    async (code: string) => {
      const normalized = code.trim().toUpperCase();
      if (!normalized.startsWith('NRI-')) return false;
      const authToken = readNeonAuthToken();
      if (!authToken) return false;
      const data = await nriJoinSession(authToken, normalized);
      if (!data) return false;
      setSessionMode('nri');
      setNriInviteCode(normalized);
      setPendingNriInvite(null);
      setCurrentView('NRI_LOBBY');
      window.location.hash = `nri/join/${normalized}`;
      void syncGame({
        sessionMode: 'nri',
        nriInviteCode: normalized,
        currentView: 'NRI_LOBBY',
      });
      return true;
    },
    [setSessionMode, setCurrentView, syncGame],
  );

  const createNriTable = useCallback(
    async (title?: string) => {
      const authToken = readNeonAuthToken();
      if (!authToken) return false;
      const session = await nriCreateSession(authToken, title);
      if (!session) return false;
      return enterNriLobby(session.inviteCode);
    },
    [enterNriLobby],
  );

  const leaveNriLobby = useCallback(() => {
    setSessionMode('solo');
    setNriInviteCode(null);
    setCurrentView('SESSION_GATE');
    window.location.hash = '';
    void syncGame({
      sessionMode: 'solo',
      nriInviteCode: undefined,
      currentView: 'SESSION_GATE',
    });
  }, [setSessionMode, setCurrentView, syncGame]);

  const applyNriResumeFromSync = useCallback(
    (gs: Record<string, unknown>, _savedView: string | undefined, resumeNri: boolean, nriCode: string | null) => {
      if (resumeNri && nriCode) {
        setSessionMode('nri');
        setNriInviteCode(nriCode);
      } else if (gs.sessionMode === 'coop') {
        setSessionMode('coop');
        setNriInviteCode(null);
      } else {
        setSessionMode('solo');
        setNriInviteCode(null);
      }
    },
    [setSessionMode],
  );

  useEffect(() => {
    if (!userId) return;
    const h = window.location.hash.replace(/^#/, '').toLowerCase();
    if (h === 'services' || h.startsWith('services/')) {
      setCurrentView('NEON_SERVICES');
      return;
    }
    const nriCode = parseNriInviteFromHash(window.location.hash);
    if (nriCode) {
      setPendingNriInvite(nriCode);
    }
  }, [userId, setCurrentView]);

  useEffect(() => {
    if (!userId || !hydrationReady) return;
    const nriCode = parseNriInviteFromHash(window.location.hash);
    if (!nriCode) return;
    const authToken = readNeonAuthToken();
    if (!authToken) return;
    const timer = window.setTimeout(() => {
      void enterNriLobby(nriCode);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId, hydrationReady, enterNriLobby]);

  const nriGuestInviteCode = readNriGuestInviteCode();

  return {
    nriInviteCode,
    setNriInviteCode,
    pendingNriInvite,
    setPendingNriInvite,
    enterNriLobby,
    createNriTable,
    leaveNriLobby,
    applyNriResumeFromSync,
    nriGuestInviteCode,
  };
}
