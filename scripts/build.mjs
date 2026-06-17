/**
 * Production build with step timing (avoids silent multi-minute waits).
 * Usage: node scripts/build.mjs [--full]
 */
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const full = process.argv.includes('--full');

const bin = (name) => path.join(root, 'node_modules', '.bin', isWin ? `${name}.cmd` : name);

function log(msg) {
  console.log(`[build] ${msg}`);
}

function copySharedJson() {
  const src = path.join(root, 'shared');
  const dest = path.join(root, 'dist_server', 'shared');
  mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const f of readdirSync(src)) {
    if (!f.endsWith('.json')) continue;
    cpSync(path.join(src, f), path.join(dest, f));
    n += 1;
  }
  log(`shared json → dist_server (${n} files)`);
}

function runSync(label, cmd, args) {
  log(`${label}…`);
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: isWin });
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.status !== 0) {
    log(`${label} FAILED (${sec}s)`);
    process.exit(r.status ?? 1);
  }
  log(`${label} ok (${sec}s)`);
}

function runParallel(jobs) {
  return new Promise((resolve, reject) => {
    let pending = jobs.length;
    let failed = false;
    for (const { label, cmd, args } of jobs) {
      log(`${label}…`);
      const t0 = Date.now();
      const child = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: isWin });
      child.on('close', (code) => {
        const sec = ((Date.now() - t0) / 1000).toFixed(1);
        if (code !== 0) {
          failed = true;
          log(`${label} FAILED (${sec}s)`);
        } else {
          log(`${label} ok (${sec}s)`);
        }
        pending -= 1;
        if (pending === 0) {
          if (failed) reject(new Error('typecheck failed'));
          else resolve();
        }
      });
    }
  });
}

async function main() {
  const tAll = Date.now();
  log(full ? 'full build (prisma + client + typecheck)' : 'build (client + typecheck)');

  if (full) {
    runSync('prisma generate', bin('prisma'), ['generate']);
  }

  runSync('vite', bin('vite'), ['build']);

  try {
    await runParallel([
      { label: 'tsc client', cmd: bin('tsc'), args: ['-p', 'tsconfig.app.json', '--noEmit'] },
      { label: 'tsc server', cmd: bin('tsc'), args: ['--project', 'tsconfig.server.json'] },
    ]);
  } catch {
    process.exit(1);
  }

  copySharedJson();

  log(`done (${((Date.now() - tAll) / 1000).toFixed(1)}s total)`);
}

main();
