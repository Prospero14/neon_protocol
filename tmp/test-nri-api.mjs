import { createApp } from '../dist_server/createApp.js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT = process.env.JWT_SECRET || 'dev-secret-change-me';

async function login(username, password) {
  const u = await prisma.user.findUnique({ where: { username } });
  if (!u) throw new Error('no user ' + username);
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) throw new Error('bad pass');
  return jwt.sign({ userId: u.id, username: u.username }, JWT);
}

const app = createApp({
  prisma,
  jwtSecret: JWT,
  getIsDbReady: () => true,
  port: 8080,
  databaseUrl: 'file:./dev.db',
  isAmvera: false,
});
const server = app.listen(0);
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

async function req(method, path, token, body) {
  const r = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j;
  try {
    j = JSON.parse(t);
  } catch {
    j = t;
  }
  return { status: r.status, body: j };
}

try {
  const adminTok = await login('admin', 'admin123');
  let r = await req('POST', '/neon_v1/services/nri/create', adminTok, { title: 'Test' });
  console.log('create', r.status, r.body?.session?.inviteCode);
  const code = r.body.session.inviteCode;
  const roomId = r.body.session.chatRoomId;
  r = await req('POST', `/neon_v1/services/nri/${code}/presets`, adminTok, {
    label: 'TestChar',
    classId: 'merc',
    sheet: {
      abilities: { STR: 10, DEX: 10, CON: 10, INT: 10, TEC: 10, PEO: 10 },
      level: 1,
      proficiencyBonus: 2,
      hpMax: 10,
      hp: 10,
      ac: 10,
    },
  });
  console.log('preset create', r.status, r.body?.preset?.id ?? r.body);
  r = await req('GET', `/neon_v1/services/nri/${code}/presets`, adminTok);
  const presetId = r.body.presets?.[0]?.id;
  console.log('presets get', r.status, r.body?.presets?.length, presetId);
  r = await req('POST', `/neon_v1/services/nri/${code}/npcs`, adminTok, { name: 'Jackie', classId: 'fixer' });
  const npcId = r.body.npc?.id;
  console.log('npc create', r.status, npcId);
  r = await req('POST', `/neon_v1/services/chat/rooms/${roomId}/messages`, adminTok, {
    text: 'hello npc',
    asNpcId: npcId,
    nriCode: code,
  });
  console.log('npc chat', r.status, r.body?.message?.isNpc, r.body?.message?.npcName);
  const u2 = await prisma.user.findFirst({ where: { NOT: { username: 'admin' } } });
  if (u2) {
    const tok2 = jwt.sign({ userId: u2.id, username: u2.username }, JWT);
    await req('POST', `/neon_v1/services/nri/${code}/join`, tok2);
    r = await req('POST', `/neon_v1/services/nri/${code}/player`, tok2, {
      displayName: 'Player2',
      presetId,
    });
    console.log('player claim', r.status, r.body?.player?.displayName ?? r.body?.message ?? r.body?.error);
  } else {
    console.log('no second user for claim test');
  }
} catch (e) {
  console.error('ERR', e);
} finally {
  server.close();
  await prisma.$disconnect();
}
