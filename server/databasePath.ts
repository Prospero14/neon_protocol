import fs from 'fs';
import path from 'path';

/**
 * Канонический путь к SQLite:
 * - NEON_DATA_DIR или /data (Amvera persistenceMount) или cwd
 * - DATABASE_URL=file:… переопределяет, если задан явно
 */
export function resolveDatabaseFilePath(): { dbPath: string; isPersistentMount: boolean } {
  const dataDir =
    process.env.NEON_DATA_DIR?.trim() ||
    (fs.existsSync('/data') ? '/data' : path.join(process.cwd()));

  const isPersistentMount = dataDir === '/data' || Boolean(process.env.NEON_DATA_DIR?.trim());
  const dbPath = path.join(dataDir, 'dev.db');

  if (process.env.DATABASE_URL?.startsWith('file:')) {
    const fromUrl = process.env.DATABASE_URL.slice('file:'.length);
    const resolved = path.isAbsolute(fromUrl) ? fromUrl : path.join(process.cwd(), fromUrl);
    return { dbPath: resolved, isPersistentMount };
  }

  return { dbPath, isPersistentMount };
}

export function ensureDatabaseDirectory(dbPath: string): void {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
