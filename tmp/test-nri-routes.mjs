const base = 'http://localhost:8080';

async function req(path, opts = {}) {
  const res = await fetch(`${base}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text.slice(0, 200); }
  return { status: res.status, data };
}

const login = await req('/neon_v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'npctest1781482453392', password: 'test1234' }),
});
const token = login.data?.token;
const code = 'NRI-T2XQ';

for (const path of [
  `/neon_v1/services/nri/${code}/join`,
  `/neon_v1/services/nri/${encodeURIComponent(code)}/npcs`,
  `/neon_v1/services/nri/${code}/vault`,
  `/neon_v1/services/nri/${code}/players`,
  `/neon_v1/services/nri/${code}/presets`,
]) {
  const r = await req(path, { headers: { Authorization: `Bearer ${token}` } });
  console.log('GET', path, r.status, typeof r.data === 'object' ? r.data.code ?? r.data : r.data);
}
