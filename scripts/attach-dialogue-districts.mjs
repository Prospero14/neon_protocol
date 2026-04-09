/**
 * Одноразово добавляет .withDistrict(...) ко всем DialogueBuilder в world/**/dialogues.ts
 * hub → kitay_gorod (как в questData / MAP_NODES).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const worldRoot = path.join(__dirname, '../src/logic/world');

const FOLDER_TO_DISTRICT = {
  hub: 'kitay_gorod',
};

function districtFromPath(fullPath) {
  const rel = path.relative(worldRoot, path.dirname(fullPath));
  const seg = rel.split(path.sep)[0];
  return FOLDER_TO_DISTRICT[seg] ?? seg;
}

function patchFile(fullPath) {
  let s = fs.readFileSync(fullPath, 'utf8');
  if (s.includes('.withDistrict(')) return 0;
  const districtId = districtFromPath(fullPath);
  if (!districtId) return 0;

  const newS = s.replace(/new\s+DialogueBuilder\(([^)]+)\)/g, (m, inner) => {
    if (m.includes('withDistrict')) return m;
    return `new DialogueBuilder(${inner}).withDistrict('${districtId}')`;
  });
  if (newS === s) return 0;
  fs.writeFileSync(fullPath, newS, 'utf8');
  return 1;
}

function walk(dir, stats) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, stats);
    else if (e.name === 'dialogues.ts') stats.patched += patchFile(p);
  }
}

const stats = { patched: 0 };
walk(worldRoot, stats);
console.log('files updated:', stats.patched);
