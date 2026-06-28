import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  nriFetchIceLeaderboard,
  nriFetchIceLeaderboards,
  nriFetchIceStatus,
  nriReportIceResult,
  nriSubmitIceScore,
} from './wallet.js';

function mockFetchResponse(body: unknown, ok = true, status = ok ? 200 : 500): Response {
  const text = JSON.stringify(body);
  return {
    ok,
    status,
    json: async () => body,
    text: async () => text,
  } as Response;
}

describe('nriFetchIceStatus — не загрузилось / ошибки', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockFetchResponse({ code: 'NRI_ICE_STATUS_FAILED' }, false, 500)),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('500 → null без throw', async () => {
    await expect(nriFetchIceStatus('tok', 'NRI-X')).resolves.toBeNull();
  });

  it('401 → null', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockFetchResponse({}, false, 401));
    await expect(nriFetchIceStatus('tok', 'NRI-X')).resolves.toBeNull();
  });
});

describe('nriFetchIceStatus — позитив', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('парсит status body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          consecutiveFails: 1,
          hardwareBanned: false,
          canPlay: true,
          tableAllBanned: false,
          failsUntilBan: 2,
        }),
      ),
    );
    const st = await nriFetchIceStatus('tok', 'NRI-OK');
    expect(st?.canPlay).toBe(true);
    expect(st?.failsUntilBan).toBe(2);
  });
});

describe('nriReportIceResult — негатив', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('400 → ok:false с сообщением', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockFetchResponse({ message: 'bad won' }, false, 400)),
    );
    const r = await nriReportIceResult('tok', 'NRI-X', true);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });
});

describe('nriFetchIceLeaderboard(s) — пустой fallback', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('leaderboard 404 → []', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({}, false, 404)));
    await expect(nriFetchIceLeaderboard('tok', 'NRI-X')).resolves.toEqual([]);
  });

  it('leaderboards без boards → {}', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({}, false, 404)));
    await expect(nriFetchIceLeaderboards('tok', 'NRI-X')).resolves.toEqual({});
  });

  it('leaderboards corrupt body (boards null) → {}', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({ boards: null })));
    await expect(nriFetchIceLeaderboards('tok', 'NRI-X')).resolves.toEqual({});
  });

  it('leaderboard corrupt entries → []', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({ entries: undefined })));
    await expect(nriFetchIceLeaderboard('tok', 'NRI-X', 'port_sweep')).resolves.toEqual([]);
  });
});

describe('nriSubmitIceScore', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('201 → ok:true', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(mockFetchResponse({ ok: true, newAchievements: [] }, true, 201)),
    );
    const r = await nriSubmitIceScore('tok', 'NRI-X', {
      gameId: 'hash_crack',
      difficulty: 'easy',
      score: 100,
      exfilPct: 100,
      tracePct: 5,
      won: true,
    });
    expect(r.ok).toBe(true);
  });

  it('500 → ok:false без throw', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({}, false, 500)));
    const r = await nriSubmitIceScore('tok', 'NRI-X', {
      score: 0,
      exfilPct: 0,
      tracePct: 100,
      won: false,
    });
    expect(r.ok).toBe(false);
  });
});
