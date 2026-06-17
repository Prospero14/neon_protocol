/** Путь к JSON-данным shared/ при запуске из dist_server или из корня репо. */

import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export function resolveSharedJsonPath(filename: string): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, '../shared', filename),
    join(here, '../../shared', filename),
    join(process.cwd(), 'shared', filename),
    join(process.cwd(), 'dist_server/shared', filename),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  throw new Error(`Shared data file not found: ${filename}`);
}
