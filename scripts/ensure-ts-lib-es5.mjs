/**
 * Локальные установки иногда приходят без lib.es5.d.ts / lib.dom.d.ts.
 * Подтягиваем официальные файлы той же версии, что и пакет typescript.
 */
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/typescript/package.json'), 'utf8'));
const ver = pkg.version;
const libDir = path.join(root, 'node_modules/typescript/lib');

/** @type {{ name: string; minBytes: number }[]} */
const REQUIRED_LIBS = [
  { name: 'lib.es5.d.ts', minBytes: 1000 },
  { name: 'lib.dom.d.ts', minBytes: 100_000 },
];

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

for (const { name, minBytes } of REQUIRED_LIBS) {
  const target = path.join(libDir, name);
  if (fs.existsSync(target) && fs.statSync(target).size >= minBytes) {
    continue;
  }
  const url = `https://unpkg.com/typescript@${ver}/lib/${name}`;
  try {
    const buf = await download(url);
    fs.mkdirSync(libDir, { recursive: true });
    fs.writeFileSync(target, buf);
    console.log(`[ensure-ts-lib] wrote ${target} (${buf.length} bytes)`);
  } catch (e) {
    console.warn(`[ensure-ts-lib] skip ${name}:`, e?.message || e);
  }
}
