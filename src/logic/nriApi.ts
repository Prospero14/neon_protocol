/** Клиент API столов НРИ (JWT). */

import type { NriInventoryItem } from './nriInventory';
import type { NriScenarioLinks, NriScenarioNode } from './nriScenario';

export type { NriScenarioNode, NriScenarioLinks };

export type NriMember = {
  userId: string;
  username: string;
  isHost: boolean;
  displayName?: string | null;
};

export type NriSessionInfo = {
  id: string;
  inviteCode: string;
  title: string;
  hostUsername: string;
  chatRoomId: string;
  status: string;
  isHost?: boolean;
  isAdmin?: boolean;
  spamBotEnabled?: boolean;
  spamPausedUntil?: number | null;
  spamPausedActive?: boolean;
};

async function parseJson(res: Response) {
  const t = await res.text();
  try {
    return JSON.parse(t);
  } catch {
    return { error: t };
  }
}

function authHeaders(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function parseNriInviteFromHash(hash: string): string | null {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] !== 'nri') return null;
  const code = (parts[1] === 'join' ? parts[2] : parts[1])?.trim().toUpperCase();
  return code && code.startsWith('NRI-') ? code : null;
}

export function buildNriInviteUrl(inviteCode: string): string {
  if (typeof window === 'undefined') return `#nri/join/${inviteCode}`;
  return `${window.location.origin}${window.location.pathname}#nri/join/${inviteCode}`;
}

export async function nriFetchInfo(code: string): Promise<{ inviteCode: string; title: string; hostUsername: string } | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/info`);
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data;
}

export async function nriCreateSession(token: string, title?: string): Promise<NriSessionInfo | null> {
  const res = await fetch('/neon_v1/services/nri/create', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.session ?? null;
}

export async function nriJoinSession(token: string, code: string): Promise<{
  session: NriSessionInfo;
  members: NriMember[];
} | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { session: data.session, members: data.members ?? [] };
}

export async function nriFetchState(token: string, code: string): Promise<{
  session: NriSessionInfo;
  members: NriMember[];
} | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/state`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { session: data.session, members: data.members ?? [] };
}

export async function nriCloseSession(token: string, code: string): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/close`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  return res.ok;
}

export async function nriSetSpamBot(token: string, code: string, enabled: boolean): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/spam-bot`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) return false;
  const data = await parseJson(res);
  return data.ok === true;
}

export type NriPlayerProfile = {
  displayName: string;
  classId: string;
  inventory?: NriInventoryItem[];
  sheet?: unknown;
  portraitUrl?: string | null;
  presetId?: string | null;
  privateNotes?: string;
};

export type NriRosterPlayer = NriPlayerProfile & {
  userId: string;
  username: string;
};

export type NriVaultFile = {
  id: string;
  title: string;
  body: string;
  protected: boolean;
  gameId: string | null;
  difficulty: string | null;
  createdAt: number;
};

export type VaultCreateResult =
  | { ok: true; file: NriVaultFile }
  | { ok: false; error: string };

function vaultCreateBody(payload: {
  title: string;
  body: string;
  protected: boolean;
  gameId?: string;
  difficulty?: string;
}) {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    isProtected: payload.protected,
    gameId: payload.gameId,
    difficulty: payload.difficulty,
  });
}

function parseApiError(data: Record<string, unknown>, fallback: string): string {
  const raw =
    (typeof data.message === 'string' && data.message) ||
    (typeof data.error === 'string' && data.error) ||
    '';
  if (/Cannot (GET|POST|PATCH|DELETE)|<!DOCTYPE html>/i.test(raw)) {
    return 'API не найден — перезапустите сервер: npm run build && npm start (порт 8080).';
  }
  if (raw) return raw;
  return fallback;
}

const parseVaultError = parseApiError;

export type NriSavePlayerResult =
  | { ok: true; player: NriPlayerProfile }
  | { ok: false; error: string };

export type NriPresetCreateResult =
  | { ok: true; preset: NriPresetCharacter }
  | { ok: false; error: string };

export type NriNpcCreateResult =
  | { ok: true; npc: NriNpc }
  | { ok: false; error: string };

export async function nriFetchPlayer(token: string, code: string): Promise<NriPlayerProfile | null | undefined> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return undefined;
  return data.player ?? null;
}

export async function nriFetchRoster(token: string, code: string): Promise<NriRosterPlayer[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/players`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.players ?? [];
}

export async function nriSavePlayer(
  token: string,
  code: string,
  displayName: string,
  opts: { classId?: string; presetId?: string; sheet?: unknown; inventory?: unknown }
): Promise<NriSavePlayerResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      displayName,
      classId: opts.classId,
      presetId: opts.presetId,
      sheet: opts.sheet,
      inventory: opts.inventory,
    }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось сохранить персонажа') };
  }
  if (!data.player) return { ok: false, error: 'Сервер не вернул профиль' };
  return { ok: true, player: data.player };
}

export type NriPresetCharacter = {
  id: string;
  label: string;
  classId: string;
  inventory: NriInventoryItem[];
  sheet: unknown;
  portraitUrl: string | null;
  publishedToPlayers: boolean;
  sortOrder: number;
  claimed: boolean;
  claimedByUserId: string | null;
  createdAt: number;
};

export type NriNpc = {
  id: string;
  name: string;
  classId: string | null;
  imageUrl: string | null;
  inventory: NriInventoryItem[];
  sheet: unknown;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

export type NriPresetsResponse = {
  presets: NriPresetCharacter[];
  meta?: {
    unclaimed: number;
    publishedUnclaimed: number;
    selectionRequired: boolean;
  };
};

export async function nriFetchPresets(
  token: string,
  code: string
): Promise<NriPresetsResponse | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/presets`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { presets: data.presets ?? [], meta: data.meta };
}

export async function vaultDeleteFile(token: string, fileId: string): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/vault/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return res.ok;
}

export async function nriCreatePreset(
  token: string,
  code: string,
  payload: {
    label: string;
    classId: string;
    inventory?: NriInventoryItem[];
    sheet?: unknown;
    portraitUrl?: string;
  }
): Promise<NriPresetCreateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/presets`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось создать персонажа') };
  }
  if (!data.preset) return { ok: false, error: 'Сервер не вернул пресет' };
  return { ok: true, preset: data.preset };
}

export async function nriDeletePreset(token: string, code: string, presetId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/presets/${encodeURIComponent(presetId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriPatchPreset(
  token: string,
  code: string,
  presetId: string,
  payload: {
    label?: string;
    classId?: string;
    inventory?: NriInventoryItem[];
    sheet?: unknown;
    portraitUrl?: string | null;
    sortOrder?: number;
    publishedToPlayers?: boolean;
  }
): Promise<NriPresetCreateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/presets/${encodeURIComponent(presetId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить персонажа') };
  if (!data.preset) return { ok: false, error: 'Сервер не вернул пресет' };
  return { ok: true, preset: data.preset };
}

export async function nriFetchNpcs(token: string, code: string): Promise<NriNpc[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/npcs`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.npcs ?? [];
}

export async function nriCreateNpc(
  token: string,
  code: string,
  payload: {
    name: string;
    classId?: string;
    imageUrl?: string;
    inventory?: NriInventoryItem[];
    sheet?: unknown;
    notes?: string;
  }
): Promise<NriNpcCreateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/npcs`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось создать НПС') };
  }
  if (!data.npc) return { ok: false, error: 'Сервер не вернул НПС' };
  return { ok: true, npc: data.npc };
}

export async function nriDeleteNpc(token: string, code: string, npcId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/npcs/${encodeURIComponent(npcId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export type NriCyberProduct = {
  id: string;
  name: string;
  slot: string;
  blueprint: unknown;
  build: unknown;
  priceWonlongs: number;
  inShop: boolean;
  vendorNpcId: string | null;
  createdAt: number;
};

type CyberMutateResult = { ok: true; product: NriCyberProduct } | { ok: false; error: string };
type CyberGrantResult = { ok: true; installed?: boolean } | { ok: false; error: string };

export async function nriFetchCyberProducts(token: string, code: string): Promise<NriCyberProduct[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/cyber`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.products ?? [];
}

export async function nriCreateCyberProduct(
  token: string,
  code: string,
  payload: {
    name: string;
    slot: string;
    blueprint: unknown;
    build: unknown;
    priceWonlongs?: number;
    inShop?: boolean;
  }
): Promise<CyberMutateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/cyber`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось сохранить имплант') };
  if (!data.product) return { ok: false, error: 'Сервер не вернул продукт' };
  return { ok: true, product: data.product };
}

export async function nriPatchCyberProduct(
  token: string,
  code: string,
  productId: string,
  patch: { inShop?: boolean; priceWonlongs?: number; name?: string }
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(patch) }
  );
  return res.ok;
}

export async function nriDeleteCyberProduct(token: string, code: string, productId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriGrantCyberProduct(
  token: string,
  code: string,
  productId: string,
  targetUserId: string,
  install?: boolean
): Promise<CyberGrantResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}/grant`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ targetUserId, install: install === true }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось выдать имплант') };
  return { ok: true, installed: !!data.installed };
}

export async function nriGrantCyberProductToNpc(
  token: string,
  code: string,
  productId: string,
  npcId: string,
  install?: boolean
): Promise<CyberGrantResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/cyber/${encodeURIComponent(productId)}/grant-npc`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ npcId, install: install === true }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось выдать имплант НПС') };
  return { ok: true, installed: !!data.installed };
}

export async function nriInstallCyberItem(
  token: string,
  code: string,
  targetUserId: string,
  itemId: string
): Promise<CyberGrantResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/players/${encodeURIComponent(targetUserId)}/cyber/install`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ itemId }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось установить имплант') };
  return { ok: true, installed: true };
}

export async function nriFetchVault(token: string, code: string): Promise<NriVaultFile[]> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vault`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.files ?? [];
}

export async function nriCreateVaultFile(
  token: string,
  code: string,
  payload: {
    title: string;
    body: string;
    protected: boolean;
    gameId?: string;
    difficulty?: string;
  }
): Promise<VaultCreateResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vault`, {
    method: 'POST',
    headers: authHeaders(token),
    body: vaultCreateBody(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseVaultError(data, 'Не удалось создать файл') };
  }
  if (!data.file) return { ok: false, error: 'Сервер не вернул файл' };
  return { ok: true, file: data.file };
}

export async function vaultFetchGlobal(token: string): Promise<NriVaultFile[]> {
  const res = await fetch('/neon_v1/services/vault/global', { headers: authHeaders(token) });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.files ?? [];
}

export async function vaultCreateGlobal(
  token: string,
  payload: {
    title: string;
    body: string;
    protected: boolean;
    gameId?: string;
    difficulty?: string;
  }
): Promise<VaultCreateResult> {
  const res = await fetch('/neon_v1/services/vault/global', {
    method: 'POST',
    headers: authHeaders(token),
    body: vaultCreateBody(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseVaultError(data, 'Не удалось создать файл') };
  }
  if (!data.file) return { ok: false, error: 'Сервер не вернул файл' };
  return { ok: true, file: data.file };
}

export async function vaultFetchFile(
  token: string,
  fileId: string
): Promise<{ file: NriVaultFile; unlocked: boolean; body?: string } | null> {
  const res = await fetch(`/neon_v1/services/vault/files/${encodeURIComponent(fileId)}`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { file: data.file, unlocked: data.unlocked, body: data.body };
}

export async function vaultUnlockFile(token: string, fileId: string): Promise<string | null> {
  const res = await fetch(`/neon_v1/services/vault/files/${encodeURIComponent(fileId)}/unlock`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.body ?? null;
}

export type NriInventoryUpdateResult =
  | { ok: true; inventory: NriInventoryItem[] }
  | { ok: false; error: string };

export type NriWalletTransferTargets = {
  players: { userId: string; displayName: string }[];
  npcs: { id: string; name: string; wonlongs: number }[];
};

export type NriWalletInfo = {
  wonlongs: number;
  tableWonlongsSum: number;
  antispamPrice: number;
  spamPausedUntil: number | null;
  spamPausedActive: boolean;
  spamBotEnabled: boolean;
  transferTargets?: NriWalletTransferTargets;
};

export type NriWalletOpResult =
  | { ok: true; wonlongs: number; spamPausedUntil?: number | null; spamPausedActive?: boolean }
  | { ok: false; error: string };

export async function nriFetchWallet(token: string, code: string): Promise<NriWalletInfo | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/wallet`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data as NriWalletInfo;
}

export async function nriPayAntispam(token: string, code: string): Promise<NriWalletOpResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/antispam/pay`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось оплатить антиспам') };
  }
  return {
    ok: true,
    wonlongs: data.wonlongs ?? 0,
    spamPausedUntil: data.spamPausedUntil ?? null,
    spamPausedActive: !!data.spamPausedActive,
  };
}

export async function nriTransferWonlongs(
  token: string,
  code: string,
  payload: {
    amount: number;
    toPlayerUserId?: string;
    toNpcId?: string;
    memo?: string;
  }
): Promise<NriWalletOpResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/wonlongs/transfer`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось перевести') };
  }
  return { ok: true, wonlongs: data.wonlongs ?? 0 };
}

export async function nriGrantWonlongs(
  token: string,
  code: string,
  payload: { playerUserId: string; amount: number; fromNpcId?: string; memo?: string }
): Promise<NriWalletOpResult & { playerUserId?: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/wonlongs/grant`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось выдать деньги') };
  }
  return { ok: true, wonlongs: data.wonlongs ?? 0, playerUserId: data.playerUserId };
}

export type NriIcePlayStatus = {
  consecutiveFails: number;
  hardwareBanned: boolean;
  canPlay: boolean;
  clearanceVia?: 'neural' | 'deck';
  tableAllBanned: boolean;
  failsUntilBan: number;
};

export async function nriFetchIceStatus(token: string, code: string): Promise<NriIcePlayStatus | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/status`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data as NriIcePlayStatus;
}

export async function nriReportIceResult(
  token: string,
  code: string,
  won: boolean
): Promise<{ ok: true; status: NriIcePlayStatus } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/result`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ won }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось сохранить результат ICE') };
  }
  return { ok: true, status: data.status as NriIcePlayStatus };
}

export type NriIceLeaderboardEntry = {
  userId: string;
  displayName: string;
  score: number;
  exfilPct: number;
  tracePct: number;
  at: number;
};

export async function nriFetchIceLeaderboard(
  token: string,
  code: string
): Promise<NriIceLeaderboardEntry[]> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/leaderboard`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.entries ?? [];
}

export async function nriSubmitIceScore(
  token: string,
  code: string,
  payload: { score: number; exfilPct: number; tracePct: number; won: boolean }
): Promise<boolean> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/ice/score`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export type NriTableVehicle = {
  id: string;
  catalogId: string;
  label: string | null;
  assignedUserId: string | null;
  assignedDisplayName: string | null;
  ownerClassId: string | null;
  ownerSheet: unknown;
  notes: string | null;
  createdAt: number;
};

export async function nriFetchVehicles(token: string, code: string): Promise<NriTableVehicle[]> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return [];
  return data.vehicles ?? [];
}

export async function nriCreateVehicle(
  token: string,
  code: string,
  payload: { catalogId: string; label?: string; notes?: string; assignedUserId?: string | null }
): Promise<{ ok: true; vehicle: NriTableVehicle } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось добавить транспорт') };
  return { ok: true, vehicle: data.vehicle };
}

export async function nriPatchVehicle(
  token: string,
  code: string,
  vehicleId: string,
  patch: { label?: string | null; notes?: string | null; assignedUserId?: string | null }
): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles/${encodeURIComponent(vehicleId)}`,
    { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(patch) }
  );
  return res.ok;
}

export async function nriDeleteVehicle(token: string, code: string, vehicleId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/vehicles/${encodeURIComponent(vehicleId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriToggleEquip(
  token: string,
  code: string,
  itemId: string
): Promise<NriInventoryUpdateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/player/items/${encodeURIComponent(itemId)}/toggle-equip`,
    { method: 'POST', headers: authHeaders(token) }
  );
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось экипировать') };
  }
  return { ok: true, inventory: data.inventory ?? [] };
}

export async function nriGrantItem(
  token: string,
  code: string,
  targetUserId: string,
  catalogId: string,
  opts?: { qty?: number; fromNpcId?: string }
): Promise<NriInventoryUpdateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/players/${encodeURIComponent(targetUserId)}/items/grant`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        catalogId,
        qty: opts?.qty,
        fromNpcId: opts?.fromNpcId,
      }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось выдать предмет') };
  }
  return { ok: true, inventory: data.inventory ?? [] };
}

export async function nriPatchPlayer(
  token: string,
  code: string,
  userId: string,
  payload: { displayName?: string; sheet?: unknown }
): Promise<NriSavePlayerResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/players/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось обновить персонажа') };
  }
  if (!data.player) return { ok: false, error: 'Сервер не вернул профиль' };
  return { ok: true, player: data.player };
}

export async function nriGrantNpcItem(
  token: string,
  code: string,
  npcId: string,
  catalogId: string,
  qty?: number
): Promise<NriInventoryUpdateResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/npcs/${encodeURIComponent(npcId)}/items/grant`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ catalogId, qty }),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) {
    return { ok: false, error: parseApiError(data, 'Не удалось выдать предмет НПС') };
  }
  return { ok: true, inventory: data.inventory ?? [] };
}

export type NriMapMarker = {
  id: string;
  label: string;
  blurb: string | null;
  x: number;
  y: number;
  kind: 'host' | 'player';
  ownerUserId: string | null;
  ownerName: string | null;
  createdAt: number;
};

export type NriMapZone = {
  zoneKey: string;
  sortOrder: number;
  name: string;
  zoneType: string;
  x: number;
  y: number;
  w: number;
  h: number;
  megaDistrict?: string | null;
  corpName: string | null;
  locked: boolean;
  pois: string[];
  color: string | null;
  updatedAt: number;
};

export type NriMapView = { w: number; h: number };

export async function nriFetchMapZones(
  token: string,
  code: string
): Promise<{ zones: NriMapZone[]; view: NriMapView } | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return { zones: data.zones ?? [], view: data.view ?? { w: 240, h: 165 } };
}

type MapZonePatchResult = { ok: true; zone: NriMapZone } | { ok: false; error: string };

export async function nriPatchMapZone(
  token: string,
  code: string,
  zoneKey: string,
  payload: { name?: string; corpName?: string | null; megaDistrict?: string; pois?: string[]; color?: string | null }
): Promise<MapZonePatchResult> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/zones/${encodeURIComponent(zoneKey)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить район') };
  if (!data.zone) return { ok: false, error: 'Сервер не вернул район' };
  return { ok: true, zone: data.zone };
}

export async function nriFetchMapMarkers(token: string, code: string): Promise<NriMapMarker[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/markers`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return data.markers ?? [];
}

type MapMarkerResult = { ok: true; marker: NriMapMarker } | { ok: false; error: string };

export async function nriCreateMapMarker(
  token: string,
  code: string,
  payload: { label: string; blurb?: string; x: number; y: number; kind?: string }
): Promise<MapMarkerResult> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/map/markers`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось поставить метку') };
  if (!data.marker) return { ok: false, error: 'Сервер не вернул метку' };
  return { ok: true, marker: data.marker };
}

export async function nriDeleteMapMarker(token: string, code: string, markerId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/map/markers/${encodeURIComponent(markerId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriFetchScenario(token: string, code: string): Promise<NriScenarioNode[] | null> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/scenario`, {
    headers: authHeaders(token),
  });
  const data = await parseJson(res);
  if (!res.ok) return null;
  return (data.nodes ?? []) as NriScenarioNode[];
}

export async function nriCreateScenarioNode(
  token: string,
  code: string,
  payload: {
    parentId?: string | null;
    title: string;
    body?: string;
    links?: NriScenarioLinks;
    sortOrder?: number;
  }
): Promise<{ ok: true; node: NriScenarioNode } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/scenario`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось создать узел') };
  return { ok: true, node: data.node as NriScenarioNode };
}

export async function nriPatchScenarioNode(
  token: string,
  code: string,
  nodeId: string,
  payload: Partial<{
    title: string;
    body: string;
    links: NriScenarioLinks;
    sortOrder: number;
    parentId: string | null;
  }>
): Promise<{ ok: true; node: NriScenarioNode } | { ok: false; error: string }> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/scenario/${encodeURIComponent(nodeId)}`,
    {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }
  );
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось обновить узел') };
  return { ok: true, node: data.node as NriScenarioNode };
}

export async function nriDeleteScenarioNode(token: string, code: string, nodeId: string): Promise<boolean> {
  const res = await fetch(
    `/neon_v1/services/nri/${encodeURIComponent(code)}/scenario/${encodeURIComponent(nodeId)}`,
    { method: 'DELETE', headers: authHeaders(token) }
  );
  return res.ok;
}

export async function nriSavePlayerNotes(
  token: string,
  code: string,
  notes: string
): Promise<{ ok: true; privateNotes: string } | { ok: false; error: string }> {
  const res = await fetch(`/neon_v1/services/nri/${encodeURIComponent(code)}/player/notes`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ notes }),
  });
  const data = await parseJson(res);
  if (!res.ok) return { ok: false, error: parseApiError(data, 'Не удалось сохранить заметки') };
  return { ok: true, privateNotes: typeof data.privateNotes === 'string' ? data.privateNotes : notes };
}

