const base = 'http://localhost:8080';

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 300); }
  return { status: res.status, data };
}

const login = await req('/neon_v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'npctest1781482453392', password: 'test1234' }),
});
const token = login.data?.token;
const code = 'NRI-T2XQ';
const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const state = await req(`/neon_v1/services/nri/${code}/state`, { headers: { Authorization: `Bearer ${token}` } });
console.log('GET state', state.status, state.data?.session?.inviteCode ?? state.data);

const vault = await req(`/neon_v1/services/nri/${code}/vault`, { headers: { Authorization: `Bearer ${token}` } });
console.log('GET vault', vault.status, vault.data);

const npc = await req(`/neon_v1/services/nri/${code}/npcs`, {
  method: 'POST',
  headers: h,
  body: JSON.stringify({ name: 'Test', classId: 'merc' }),
});
console.log('POST npc', npc.status, npc.data);

const health = await req('/neon_v1/services/health');
console.log('health', health.data);
