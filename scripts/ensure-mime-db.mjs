/**
 * Неполные node_modules иногда без mime-db/db.json → express/supertest падают в тестах.
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const targets = [
  path.join(root, 'node_modules/mime-db/db.json'),
  path.join(root, 'node_modules/form-data/node_modules/mime-db/db.json'),
];

for (const target of targets) {
  const pkgDir = path.dirname(target);
  const pkgPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  const ver = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  if (fs.existsSync(target) && fs.statSync(target).size > 10000) continue;
  const url = `https://unpkg.com/mime-db@${ver}/db.json`;
  try {
    const buf = await download(url);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf);
    console.log(`[ensure-mime-db] wrote ${target} (${buf.length} bytes)`);
  } catch (e) {
    console.warn('[ensure-mime-db] skip:', target, e?.message || e);
  }
}

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const loc = res.headers.location;
          if (!loc) return reject(new Error('Redirect without location'));
          https
            .get(loc, (r2) => {
              const chunks = [];
              r2.on('data', (c) => chunks.push(c));
              r2.on('end', () => resolve(Buffer.concat(chunks)));
              r2.on('error', reject);
            })
            .on('error', reject);
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}
