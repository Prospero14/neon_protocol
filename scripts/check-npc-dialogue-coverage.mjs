/**
 * Compares NPC ids (profiles + day/night contacts + metro) to dialogue tree keys.
 * Run: node scripts/check-npc-dialogue-coverage.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function walk(dir, pred) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p, pred));
    else if (pred(p)) out.push(p);
  }
  return out;
}

function extractIdsFromProfiles() {
  const ids = new Set();
  const profiles = walk(path.join(root, 'src/logic/world'), (p) => p.endsWith('profile.ts'));
  for (const file of profiles) {
    const text = fs.readFileSync(file, 'utf8');
    const m = text.match(/id:\s*'(npc_[a-z0-9_]+)'/);
    if (m) ids.add(m[1]);
  }
  const academyNpcs = fs.readFileSync(path.join(root, 'src/logic/world/academy/npcs.ts'), 'utf8');
  for (const m of academyNpcs.matchAll(/id:\s*'(npc_[a-z0-9_]+)'/g)) ids.add(m[1]);

  const metro = fs.readFileSync(path.join(root, 'src/logic/world/metro_stub/index.ts'), 'utf8');
  const metroNpc = metro.match(/id:\s*'(metro_dispatch)'/);
  if (metroNpc) ids.add(metroNpc[1]);

  return ids;
}

function extractDayNightIds() {
  const ids = new Set();
  const day = fs.readFileSync(path.join(root, 'src/logic/dayContacts.ts'), 'utf8');
  for (const m of day.matchAll(/\{\s*id:\s*'([a-z0-9_]+)',\s*npcName:/g)) {
    ids.add(`npc_day_${m[1]}`);
  }
  const night = fs.readFileSync(path.join(root, 'src/logic/nightContacts.ts'), 'utf8');
  for (const m of night.matchAll(/\{\s*id:\s*'([a-z0-9_]+)',\s*npcName:/g)) {
    ids.add(`npc_night_${m[1]}`);
  }
  return ids;
}

function extractDialogueNpcKeys() {
  const keys = new Set();
  const districts = fs.readdirSync(path.join(root, 'src/logic/world')).filter(
    (d) => fs.statSync(path.join(root, 'src/logic/world', d)).isDirectory() && !['types'].includes(d)
  );
  for (const d of districts) {
    const idx = path.join(root, 'src/logic/world', d, 'index.ts');
    if (!fs.existsSync(idx)) continue;
    const text = fs.readFileSync(idx, 'utf8');
    for (const m of text.matchAll(/^\s{2,}(npc_[a-z0-9_]+|metro_dispatch):\s/gm)) keys.add(m[1]);
  }
  const academyDlg = fs.readFileSync(path.join(root, 'src/logic/world/academy/dialogues.ts'), 'utf8');
  for (const m of academyDlg.matchAll(/^\s{2,}(npc_[a-z0-9_]+|bar_[a-z0-9_]+):\s/gm)) keys.add(m[1]);

  const day = fs.readFileSync(path.join(root, 'src/logic/dayContacts.ts'), 'utf8');
  for (const m of day.matchAll(/new DialogueBuilder\('(npc_day_[a-z0-9_]+)'\)/g)) keys.add(m[1]);
  const night = fs.readFileSync(path.join(root, 'src/logic/nightContacts.ts'), 'utf8');
  for (const m of night.matchAll(/new DialogueBuilder\('(npc_night_[a-z0-9_]+)'\)/g)) keys.add(m[1]);

  return keys;
}

const profileIds = extractIdsFromProfiles();
const dayNightIds = extractDayNightIds();
const allNpcIds = new Set([...profileIds, ...dayNightIds]);

const dialogueKeys = extractDialogueNpcKeys();

// Day/night trees are built with `new DialogueBuilder(npcId)` (variable) — cannot grep literals.
// If seeds match DAY_CONTACT_DIALOGUES / NIGHT reduce, coverage is guaranteed.
const daySrc = fs.readFileSync(path.join(root, 'src/logic/dayContacts.ts'), 'utf8');
const nightSrc = fs.readFileSync(path.join(root, 'src/logic/nightContacts.ts'), 'utf8');
const dayNightOk =
  daySrc.includes('acc[npcId] = new DialogueBuilder(npcId)') && daySrc.includes('DAY_CONTACT_DIALOGUES');
const nightNightOk =
  nightSrc.includes('acc[npcId] = new DialogueBuilder(npcId)') && nightSrc.includes('NIGHT_CONTACT_DIALOGUES');

const staticNpcIds = new Set([...profileIds, 'metro_dispatch']);
const missingDialogue = [...staticNpcIds].filter((id) => !dialogueKeys.has(id)).sort();
const orphanDialogueNpc = [...dialogueKeys]
  .filter((id) => (id.startsWith('npc_') || id === 'metro_dispatch') && !id.startsWith('npc_day_') && !id.startsWith('npc_night_'))
  .filter((id) => !staticNpcIds.has(id))
  .sort();

console.log('Static NPC (profiles + academy + metro):', staticNpcIds.size);
console.log('Day/night contact NPC (from seeds):', dayNightIds.size, dayNightOk && nightNightOk ? '(dialogues via reduce: OK)' : '(WARN: check reduce)');
console.log('Dialogue keys in district index.ts + academy/dialogues.ts:', dialogueKeys.size);
if (!dayNightOk || !nightNightOk) {
  console.log('\n[WARN] day/night DialogueBuilder pattern not found — verify dayContacts.ts / nightContacts.ts');
}
if (missingDialogue.length) {
  console.log('\nMISSING dialogue tree for static NPC id:');
  missingDialogue.forEach((id) => console.log('  ', id));
}
if (orphanDialogueNpc.length) {
  console.log('\nDialogue keys in maps without matching profile (informational):');
  orphanDialogueNpc.forEach((id) => console.log('  ', id));
}
process.exit(missingDialogue.length ? 1 : 0);
