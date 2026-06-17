console.log('[NEON_BOOT] Server process starting...');
import dotenv from 'dotenv';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { ensureNriLoreEntryTable } from './services/nriLoreSchema.js';
import { ensureNriFactionSchema } from './services/nriFactionSchema.js';
import { createApp } from './createApp.js';
import { ensureDatabaseDirectory, resolveDatabaseFilePath } from './databasePath.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'neon_secret_key_2026';

const { dbPath: defaultDbPath, isPersistentMount: isAmvera } = resolveDatabaseFilePath();
const defaultDbUrl = `file:${defaultDbPath}`;

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDbUrl;
}

ensureDatabaseDirectory(defaultDbPath);

console.log(`[NEON_BOOT] RESOLVED_DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log(`[NEON_BOOT] RESOLVED_FILE_PATH: ${defaultDbPath}`);

/** Синхронизирует схему Prisma с SQLite (fallback при P3005 / отсутствующих таблицах). */
function runDbPushSync(): void {
  const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  if (!fs.existsSync(prismaCli)) return;
  try {
    execFileSync(process.execPath, [prismaCli, 'db', 'push', '--accept-data-loss'], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: 'inherit',
    });
    console.log('[NEON_BOOT] prisma db push: ok');
  } catch (e) {
    console.error('[NEON_BOOT] prisma db push failed:', e);
  }
}

/** Применяет миграции к SQLite на диске (/data на Amvera). Иначе старая БД без новых колонок ломает Prisma-запросы. */
function runMigrateDeploySync(): void {
  const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  if (!fs.existsSync(prismaCli)) {
    console.warn('[NEON_BOOT] prisma CLI missing; skip migrate deploy');
    return;
  }
  try {
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
      cwd: process.cwd(),
      env: { ...process.env },
      stdio: 'pipe',
      encoding: 'utf8',
    });
    console.log('[NEON_BOOT] prisma migrate deploy: ok');
  } catch (e) {
    const err = e as { message?: unknown; stdout?: unknown; stderr?: unknown };
    const msg = String(err.message ?? e ?? '');
    const stdout = String(err.stdout ?? '');
    const stderr = String(err.stderr ?? '');
    const prismaOutput = `${stdout}\n${stderr}\n${msg}`;
    // Existing production SQLite can be non-empty without migration history.
    // In this case Prisma returns P3005; sync schema via db push.
    if (prismaOutput.includes('P3005') || prismaOutput.includes('The database schema is not empty')) {
      console.warn('[NEON_BOOT] prisma migrate deploy skipped: P3005 (existing non-empty DB baseline)');
      console.warn('[NEON_BOOT] applying schema via prisma db push…');
      runDbPushSync();
      return;
    }
    console.error('[NEON_BOOT] prisma migrate deploy failed:', stderr || msg);
  }
}

runMigrateDeploySync();

const adapter = new PrismaBetterSqlite3({
  url: `file:${defaultDbPath}`,
});

const prisma = new PrismaClient({ adapter });

/** Если после migrate/push всё ещё нет новых таблиц — точечный db push по probe. */
async function ensureNriSchemaSync(): Promise<void> {
  try {
    await prisma.nriPresetCharacter.findFirst({ select: { id: true } });
  } catch {
    console.warn('[NEON_BOOT] NriPresetCharacter missing — applying schema…');
    runDbPushSync();
  }
  try {
    await prisma.nriCyberProduct.findFirst({ select: { id: true } });
  } catch {
    console.warn('[NEON_BOOT] NriCyberProduct missing — applying schema…');
    runDbPushSync();
  }
  try {
    await prisma.nriSession.findFirst({ select: { spamPausedUntil: true } });
  } catch {
    console.warn('[NEON_BOOT] NriSession.spamPausedUntil missing — applying schema…');
    runDbPushSync();
  }
  try {
    await prisma.nriCombatant.findFirst({ select: { id: true } });
  } catch {
    console.warn('[NEON_BOOT] NriCombatant missing — applying schema…');
    runDbPushSync();
  }
  try {
    await prisma.coopLiveMatch.findFirst({ select: { id: true } });
  } catch {
    console.warn('[NEON_BOOT] CoopLiveMatch missing — applying schema…');
    runDbPushSync();
  }
  try {
    await prisma.nriLoreEntry.findFirst({ select: { id: true } });
  } catch {
    console.warn('[NEON_BOOT] NriLoreEntry missing — applying schema…');
    try {
      await ensureNriLoreEntryTable(prisma);
    } catch (e) {
      console.warn('[NEON_BOOT] NriLoreEntry ensure failed, trying db push…', e);
      runDbPushSync();
    }
  }
  try {
    await prisma.nriFactionRelationState.findFirst({ select: { sessionId: true } });
  } catch {
    console.warn('[NEON_BOOT] NriFactionRelationState missing — applying schema…');
    runDbPushSync();
  }
  try {
    await prisma.nriFaction.findFirst({ select: { id: true, kind: true, zoneKeys: true } });
  } catch {
    console.warn('[NEON_BOOT] NriFaction columns missing — ensuring schema…');
    try {
      await ensureNriFactionSchema(prisma);
    } catch (e) {
      console.warn('[NEON_BOOT] NriFaction ensure failed, trying db push…', e);
      runDbPushSync();
    }
  }
}

let isDbReady = false;

async function initDB() {
  console.log(`[NEON_CORE] PERSISTENCE_PATH: ${process.env.DATABASE_URL}`);
  console.log(`[NEON_CORE] AMVERA_DETECTED: ${isAmvera}`);
  console.log('[NEON_CORE] DB Init Started...');
  try {
    await prisma.$connect();
    console.log('[NEON_CORE] Database connected successfully.');
    await ensureNriSchemaSync();
    await seedAdmin();
    isDbReady = true;
    console.log('[NEON_CORE] INIT_COMPLETE: SYSTEM_READY');
  } catch (e) {
    console.error('[NEON_CORE] DB Connection Error:', e);
    throw e;
  }
}

async function seedAdmin() {
  const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!admin) {
    console.log('[NEON_CORE] Seeding admin account...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const starterDeck = [
      { id: 'script_ping', count: 4 },
      { id: 'script_grep', count: 4 },
      { id: 'soft_coffee', count: 4 },
    ];
    await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        gameState: {
          create: {
            bits: 10000,
            level: 5,
            ramPool: 4.0,
            stress: 0,
            maxStress: 100,
            activeDeck: starterDeck,
            inventory: starterDeck,
            artifacts: [],
            completedQuests: [],
            reputation: { EU_SYNTAX: 50 },
            intel: ['EU Syntax'],
          },
        },
      },
    });
  }
}

const app = createApp({
  prisma,
  jwtSecret: JWT_SECRET,
  getIsDbReady: () => isDbReady,
  port: PORT,
  databaseUrl: process.env.DATABASE_URL,
  isAmvera,
});

async function bootstrap() {
  await initDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('=========================================');
    console.log(`[NEON_CORE] SERVER_STABILIZED_V32_3`);
    console.log(`[NEON_CORE] PORT: ${PORT}`);
    console.log('=========================================');
  });
}

bootstrap().catch((err) => {
  console.error('[NEON_CORE] CRITICAL_INIT_FAILED:', err);
  process.exit(1);
});
