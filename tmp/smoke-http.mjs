const base = 'http://127.0.0.1:8080';

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

const login = await req('POST', '/neon_v1/auth/login', null, { username: 'admin', password: 'admin123' });
console.log('login', login.status, login.body?.token ? 'ok' : login.body);
const tok = login.body.token;
if (!tok) process.exit(1);

let r = await req('POST', '/neon_v1/services/nri/create', tok, { title: 'Smoke' });
console.log('create', r.status, r.body?.session?.inviteCode ?? r.body);
const code = r.body.session?.inviteCode;
const roomId = r.body.session?.chatRoomId;

r = await req('POST', `/neon_v1/services/nri/${code}/presets`, tok, {
  label: 'SmokeChar',
  classId: 'merc',
  sheet: {
    abilities: { STR: 12, DEX: 10, CON: 11, INT: 9, TEC: 8, PEO: 10 },
    level: 1,
    proficiencyBonus: 2,
    hpMax: 12,
    hp: 12,
    ac: 11,
  },
});
console.log('preset', r.status, r.body?.preset?.id ?? r.body);

r = await req('GET', `/neon_v1/services/nri/${code}/presets`, tok);
console.log('presets', r.status, r.body?.presets?.length);

r = await req('POST', `/neon_v1/services/nri/${code}/npcs`, tok, { name: 'NPC1', classId: 'fixer' });
const npcId = r.body.npc?.id;
console.log('npc', r.status, npcId ?? r.body);

r = await req('POST', `/neon_v1/services/chat/rooms/${roomId}/messages`, tok, {
  text: 'test npc line',
  asNpcId: npcId,
  nriCode: code,
});
console.log('chat npc', r.status, r.body?.message?.isNpc, r.body?.message?.npcName ?? r.body);
