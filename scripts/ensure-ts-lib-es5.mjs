/**
 * Локальные установки иногда приходят без lib.es5.d.ts → TS2318 (Boolean/Object/…).
 * Подтягиваем официальный файл той же версии, что и пакет typescript.
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/typescript/package.json'), 'utf8'));
const ver = pkg.version;
const target = path.join(root, 'node_modules/typescript/lib/lib.es5.d.ts');
const url = `https://unpkg.com/typescript@${ver}/lib/lib.es5.d.ts`;

if (fs.existsSync(target) && fs.statSync(target).size > 1000) {
  process.exit(0);
}

function download() {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const loc = res.headers.location;
          if (!loc) return reject(new Error('Redirect without location'));
          https.get(loc, (r2) => {
            const chunks = [];
            r2.on('data', (c) => chunks.push(c));
            r2.on('end', () => resolve(Buffer.concat(chunks)));
            r2.on('error', reject);
          }).on('error', reject);
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

try {
  const buf = await download();
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buf);
  console.log(`[ensure-ts-lib-es5] wrote ${target} (${buf.length} bytes)`);
} catch (e) {
  console.warn('[ensure-ts-lib-es5] skip:', e?.message || e);
  process.exit(0);
}
