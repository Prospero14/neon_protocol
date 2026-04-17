/**
 * Интеграционные сценарии HTTP API: auth/sync (Prisma mock), кооп-лобби (in-memory).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { PrismaClient } from '@prisma/client';
import { createApp } from './createApp';

const JWT_SECRET = 'test_neon_jwt_secret';

function mockPrisma(): Pick<PrismaClient, 'user' | 'gameState' | 'coopStartupScore'> {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    } as unknown as PrismaClient['user'],
    gameState: {
      update: vi.fn(),
    } as unknown as PrismaClient['gameState'],
    coopStartupScore: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    } as unknown as PrismaClient['coopStartupScore'],
  };
}

describe('neon_v1 API (integration)', () => {
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    vi.clearAllMocks();
  });

  function app() {
    return createApp({
      prisma: prisma as unknown as PrismaClient,
      jwtSecret: JWT_SECRET,
      getIsDbReady: () => false,
      port: 8080,
      databaseUrl: 'file:test.db',
      isAmvera: false,
    });
  }

  it('GET /neon_v1/health', async () => {
    const res = await request(app()).get('/neon_v1/health').expect(200);
    expect(res.body.status).toBe('initializing');
    expect(res.body).toHaveProperty('port');
  });

  it('POST /neon_v1/auth/login + /neon_v1/game/sync (Prisma mock)', async () => {
    const hash = await bcrypt.hash('secret99', 4);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'uid-sync',
      username: 'syncuser',
      passwordHash: hash,
      gameState: {
        id: 'gs',
        userId: 'uid-sync',
        bits: 100,
        stress: 0,
        maxStress: 100,
        xp: 0,
        level: 1,
        activeDeck: [],
        inventory: [],
        artifacts: [],
        completedQuests: [],
      },
    } as any);

    vi.mocked(prisma.gameState.update).mockResolvedValue({
      id: 'gs',
      userId: 'uid-sync',
      bits: 250,
      stress: 1,
      maxStress: 100,
      xp: 0,
      level: 1,
      activeDeck: [{ id: 'x', count: 1 }],
      inventory: [],
      artifacts: [],
      completedQuests: [],
    } as any);

    const application = app();
    const login = await request(application)
      .post('/neon_v1/auth/login')
      .send({ username: 'syncuser', password: 'secret99' })
      .expect(200);

    const token = login.body.token as string;
    expect(token).toBeTruthy();

    const sync = await request(application)
      .post('/neon_v1/game/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        stress: 1,
        maxStress: 100,
        bits: 250,
        xp: 0,
        level: 1,
        activeDeck: [{ id: 'x', count: 1 }],
        inventory: [],
        artifacts: [],
        completedQuests: [],
      })
      .expect(200);

    expect(sync.body.bits).toBe(250);
    expect(prisma.gameState.update).toHaveBeenCalled();
  });

  it('coop: heartbeat → виден другой игрок; invite → party из двух', async () => {
    const a = app();
    const tokA = jwt.sign({ userId: 'user-a' }, JWT_SECRET);
    const tokB = jwt.sign({ userId: 'user-b' }, JWT_SECRET);

    await request(a)
      .post('/neon_v1/coop/heartbeat')
      .set('Authorization', `Bearer ${tokA}`)
      .send({ displayName: 'HostPlayer', coopRole: 'developer', clientUsername: 'u1' })
      .expect(200);

    const hbB = await request(a)
      .post('/neon_v1/coop/heartbeat')
      .set('Authorization', `Bearer ${tokB}`)
      .send({ displayName: 'GuestPlayer', coopRole: 'qa', clientUsername: 'u2' })
      .expect(200);

    expect(hbB.body.online.some((u: { displayName: string }) => u.displayName === 'HostPlayer')).toBe(true);

    const inv = await request(a)
      .post('/neon_v1/coop/invite')
      .set('Authorization', `Bearer ${tokA}`)
      .send({ targetDisplayName: 'GuestPlayer' })
      .expect(200);

    expect(inv.body.party.members.length).toBe(2);
    expect(inv.body.party.members.map((m: { userId: string }) => m.userId).sort()).toEqual(['user-a', 'user-b']);
  });

  it('coop: chat только после heartbeat', async () => {
    const a = app();
    const tok = jwt.sign({ userId: 'user-c' }, JWT_SECRET);

    await request(a).post('/neon_v1/coop/chat').set('Authorization', `Bearer ${tok}`).send({ text: 'nope' }).expect(400);

    await request(a)
      .post('/neon_v1/coop/heartbeat')
      .set('Authorization', `Bearer ${tok}`)
      .send({ displayName: 'Chatter', coopRole: 'pm', clientUsername: 'x' })
      .expect(200);

    const ch = await request(a).post('/neon_v1/coop/chat').set('Authorization', `Bearer ${tok}`).send({ text: 'hello lobby' }).expect(200);
    expect(ch.body.ok).toBe(true);
  });

  it('coop: party/leave сбрасывает party', async () => {
    const a = app();
    const tokA = jwt.sign({ userId: 'user-d' }, JWT_SECRET);
    const tokB = jwt.sign({ userId: 'user-e' }, JWT_SECRET);

    await request(a)
      .post('/neon_v1/coop/heartbeat')
      .set('Authorization', `Bearer ${tokA}`)
      .send({ displayName: 'Lead', coopRole: 'admin', clientUsername: 'd' });
    await request(a)
      .post('/neon_v1/coop/heartbeat')
      .set('Authorization', `Bearer ${tokB}`)
      .send({ displayName: 'Join', coopRole: 'qa', clientUsername: 'e' });

    await request(a).post('/neon_v1/coop/invite').set('Authorization', `Bearer ${tokA}`).send({ targetDisplayName: 'Join' }).expect(200);

    const leave = await request(a).post('/neon_v1/coop/party/leave').set('Authorization', `Bearer ${tokA}`).expect(200);
    expect(leave.body.party).toBeNull();
  });

  it('GET /neon_v1/coop/startup-rankings (Prisma mock)', async () => {
    vi.mocked(prisma.coopStartupScore.findMany).mockResolvedValue([]);
    const res = await request(app()).get('/neon_v1/coop/startup-rankings').expect(200);
    expect(Array.isArray(res.body.rows)).toBe(true);
    expect(res.body.rows.length).toBeGreaterThan(0);
    expect(res.body.rows[0]).toMatchObject({ rank: 1, tag: 'NPC' });
  });

  it('POST /neon_v1/coop/startup-rankings/submit (Prisma mock)', async () => {
    vi.mocked(prisma.coopStartupScore.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.coopStartupScore.upsert).mockResolvedValue({
      id: 'css1',
      userId: 'uid-rank',
      startupName: 'TEST_LAB',
      score: 500,
      tierRank: 'junior',
      missionsCleared: 2,
      bits: 100,
      updatedAt: new Date(),
    } as any);
    const tok = jwt.sign({ userId: 'uid-rank' }, JWT_SECRET);
    const res = await request(app())
      .post('/neon_v1/coop/startup-rankings/submit')
      .set('Authorization', `Bearer ${tok}`)
      .send({
        startupName: 'TEST_LAB',
        score: 500,
        tierRank: 'junior',
        missionsCleared: 2,
        bits: 100,
      })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.updated).toBe(true);
    expect(res.body.entry.score).toBe(500);
  });
});
