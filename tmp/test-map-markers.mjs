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
    j = t.slice(0, 300);
  }
  return { status: r.status, body: j };
}

const hostLogin = await req('POST', '/neon_v1/auth/login', null, {
  username: 'npctest1781482453392',
  password: 'test1234',
});
const hostTok = hostLogin.body?.token;
if (!hostTok) {
  console.error('host login failed', hostLogin);
  process.exit(1);
}

const create = await req('POST', '/neon_v1/services/nri/create', hostTok, { title: 'MapMarkerTest' });
const code = create.body?.session?.inviteCode;
if (!code) {
  console.error('create failed', create);
  process.exit(1);
}
console.log('session', code);

const hostMarker = await req('POST', `/neon_v1/services/nri/${code}/map/markers`, hostTok, {
  label: 'Host rally',
  blurb: 'master point',
  x: 35,
  y: 40,
});
console.log('host create', hostMarker.status, hostMarker.body?.marker?.kind, hostMarker.body?.marker?.ownerName);

const playerName = `maptest_${Date.now()}`;
const playerReg = await req('POST', '/neon_v1/auth/register', null, {
  username: playerName,
  password: 'test1234',
});
if (playerReg.status !== 201 && playerReg.status !== 200) {
  console.error('player register failed', playerReg);
  process.exit(1);
}
const playerLogin = await req('POST', '/neon_v1/auth/login', null, {
  username: playerName,
  password: 'test1234',
});
const playerTok = playerLogin.body?.token;
if (!playerTok) {
  console.error('player login failed', playerLogin);
  process.exit(1);
}

const join = await req('POST', `/neon_v1/services/nri/${code}/join`, playerTok, {
  displayName: 'Runner',
  classId: 'merc',
});
console.log('join', join.status, join.body?.code ?? join.body?.message ?? join.body);

const playerMarker = await req('POST', `/neon_v1/services/nri/${code}/map/markers`, playerTok, {
  label: 'Player hideout',
  x: 65,
  y: 55,
});
console.log('player create', playerMarker.status, playerMarker.body?.marker?.kind, playerMarker.body?.marker?.ownerName);

const listHost = await req('GET', `/neon_v1/services/nri/${code}/map/markers`, hostTok);
const listPlayer = await req('GET', `/neon_v1/services/nri/${code}/map/markers`, playerTok);
console.log(
  'host sees',
  listHost.body?.markers?.map((m) => ({ label: m.label, kind: m.kind, owner: m.ownerName }))
);
console.log(
  'player sees',
  listPlayer.body?.markers?.map((m) => ({ label: m.label, kind: m.kind, owner: m.ownerName }))
);

const ok =
  hostMarker.status === 201 &&
  playerMarker.status === 201 &&
  listHost.body?.markers?.length === 2 &&
  listPlayer.body?.markers?.length === 2 &&
  listHost.body.markers.some((m) => m.kind === 'host') &&
  listHost.body.markers.some((m) => m.kind === 'player');
console.log(ok ? 'PASS' : 'FAIL');
