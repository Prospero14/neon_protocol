import { describe, expect, it } from 'vitest';
import { authCredentialsSchema } from './auth.js';
import { gameSyncPayloadSchema } from './gameSync.js';
import {
  nriIceResultSchema,
  nriIceScoreSchema,
  nriItemGrantSchema,
  nriPlayerSaveSchema,
  nriWonlongsTransferSchema,
} from './nri.js';
import { parseRequestBody } from './parseBody.js';

describe('authCredentialsSchema', () => {
  it('accepts non-empty username/password', () => {
    const r = parseRequestBody(authCredentialsSchema, { username: 'neo', password: 'secret' });
    expect(r.ok).toBe(true);
  });

  it('rejects empty username', () => {
    const r = parseRequestBody(authCredentialsSchema, { username: '  ', password: 'x' });
    expect(r.ok).toBe(false);
  });
});

describe('gameSyncPayloadSchema', () => {
  it('accepts core fields and extra clientSnapshot keys', () => {
    const r = parseRequestBody(gameSyncPayloadSchema, {
      bits: 100,
      sessionMode: 'nri',
      currentView: 'NRI_LOBBY',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.bits).toBe(100);
      expect((r.data as { sessionMode?: string }).sessionMode).toBe('nri');
    }
  });

  it('rejects non-numeric bits', () => {
    const r = parseRequestBody(gameSyncPayloadSchema, { bits: 'lots' });
    expect(r.ok).toBe(false);
  });
});

describe('nri schemas', () => {
  it('nriPlayerSaveSchema requires displayName', () => {
    expect(parseRequestBody(nriPlayerSaveSchema, {}).ok).toBe(false);
    expect(parseRequestBody(nriPlayerSaveSchema, { displayName: 'Neo' }).ok).toBe(true);
  });

  it('nriWonlongsTransferSchema requires one target', () => {
    expect(parseRequestBody(nriWonlongsTransferSchema, { amount: 10 }).ok).toBe(false);
    expect(
      parseRequestBody(nriWonlongsTransferSchema, { amount: 10, toPlayerUserId: 'u1' }).ok,
    ).toBe(true);
  });

  it('nriItemGrantSchema requires catalogId', () => {
    expect(parseRequestBody(nriItemGrantSchema, {}).ok).toBe(false);
  });

  it('nriIceScoreSchema rejects NaN and non-finite numbers', () => {
    expect(parseRequestBody(nriIceScoreSchema, { score: NaN, won: true }).ok).toBe(false);
    expect(parseRequestBody(nriIceScoreSchema, { tracePct: Infinity }).ok).toBe(false);
    expect(parseRequestBody(nriIceScoreSchema, { exfilPct: '50' }).ok).toBe(false);
  });

  it('nriIceScoreSchema rejects invalid difficulty enum', () => {
    expect(parseRequestBody(nriIceScoreSchema, { difficulty: 'insane', won: true }).ok).toBe(false);
  });

  it('nriIceResultSchema requires boolean won', () => {
    expect(parseRequestBody(nriIceResultSchema, {}).ok).toBe(false);
    expect(parseRequestBody(nriIceResultSchema, { won: 'yes' }).ok).toBe(false);
    expect(parseRequestBody(nriIceResultSchema, { won: true }).ok).toBe(true);
  });

  it('nriIceScoreSchema accepts minimal win payload', () => {
    expect(parseRequestBody(nriIceScoreSchema, { won: true }).ok).toBe(true);
    expect(parseRequestBody(nriIceScoreSchema, { won: false, score: 100 }).ok).toBe(true);
  });

  it('nriIceScoreSchema null/undefined body → пустой объект (все поля optional)', () => {
    expect(parseRequestBody(nriIceScoreSchema, null).ok).toBe(true);
    expect(parseRequestBody(nriIceScoreSchema, undefined).ok).toBe(true);
  });

  it('nriIceScoreSchema rejects array body', () => {
    expect(parseRequestBody(nriIceScoreSchema, []).ok).toBe(false);
  });

  it('nriIceScoreSchema rejects empty gameId string when provided', () => {
    expect(parseRequestBody(nriIceScoreSchema, { gameId: '   ', won: true }).ok).toBe(false);
  });

  it('nriIceResultSchema rejects null and extra won types', () => {
    expect(parseRequestBody(nriIceResultSchema, null).ok).toBe(false);
    expect(parseRequestBody(nriIceResultSchema, { won: 1 }).ok).toBe(false);
    expect(parseRequestBody(nriIceResultSchema, { won: false }).ok).toBe(true);
  });

  it('nriWonlongsTransferSchema rejects both targets at once', () => {
    expect(
      parseRequestBody(nriWonlongsTransferSchema, {
        amount: 10,
        toPlayerUserId: 'u1',
        toNpcId: 'npc1',
      }).ok,
    ).toBe(false);
  });

  it('nriWonlongsTransferSchema rejects non-positive amount', () => {
    expect(parseRequestBody(nriWonlongsTransferSchema, { amount: 0, toPlayerUserId: 'u1' }).ok).toBe(false);
    expect(parseRequestBody(nriWonlongsTransferSchema, { amount: -5, toPlayerUserId: 'u1' }).ok).toBe(false);
  });
});
