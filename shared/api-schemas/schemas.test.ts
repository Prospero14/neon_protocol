import { describe, expect, it } from 'vitest';
import { authCredentialsSchema } from './auth.js';
import { gameSyncPayloadSchema } from './gameSync.js';
import {
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
});
