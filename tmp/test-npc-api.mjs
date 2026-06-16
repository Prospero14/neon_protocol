const base = 'http://localhost:8080';

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const user = `npctest${Date.now()}`;
const reg = await req('/neon_v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: user, password: 'test1234' }),
});
console.log('register', reg.status, reg.data);
const login = await req('/neon_v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: user, password: 'test1234' }),
});
console.log('login', login.status, login.data?.token ? 'ok' : login.data);
if (!login.data?.token) process.exit(1);
const token = login.data.token;

const sess = await req('/neon_v1/services/nri/create', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'NPC test' }),
});
console.log('create session', sess.status, sess.data);
const code = sess.data?.session?.inviteCode;
if (!code) process.exit(1);

const npc = await req(`/neon_v1/services/nri/${code}/npcs`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jackie Chow',
    classId: 'merc',
    sheet: {
      abilities: { STR: 12, DEX: 10, CON: 11, INT: 9, TEC: 14, PEO: 8 },
      level: 1,
      proficiencyBonus: 2,
      hpMax: 10,
      hp: 10,
      ac: 10,
    },
  }),
});
console.log('create npc', npc.status, npc.data);

const list = await req(`/neon_v1/services/nri/${code}/npcs`, {
  headers: { Authorization: `Bearer ${token}` },
});
console.log('list npcs', list.status, list.data);

const presets = await req(`/neon_v1/services/nri/${code}/presets`, {
  headers: { Authorization: `Bearer ${token}` },
});
console.log('list presets', presets.status, typeof presets.data === 'string' ? presets.data.slice(0, 80) : presets.data);
