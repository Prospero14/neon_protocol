console.log('[NEON_BOOT] Server process starting...');
import dotenv from 'dotenv';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { createApp } from './createApp.js';
dotenv.config();
const PORT = Number(process.env.PORT) || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'neon_secret_key_2026';
const isAmvera = fs.existsSync('/data');
const defaultDbPath = isAmvera ? '/data/dev.db' : path.join(process.cwd(), 'dev.db');
const defaultDbUrl = `file:${defaultDbPath}`;
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = defaultDbUrl;
}
console.log(`[NEON_BOOT] RESOLVED_DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log(`[NEON_BOOT] RESOLVED_FILE_PATH: ${defaultDbPath}`);
/** Применяет миграции к SQLite на диске (/data на Amvera). Иначе старая БД без новых колонок ломает Prisma-запросы. */
function runMigrateDeploySync() {
    const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
    if (!fs.existsSync(prismaCli)) {
        console.warn('[NEON_BOOT] prisma CLI missing; skip migrate deploy');
        return;
    }
    try {
        execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
            cwd: process.cwd(),
            env: { ...process.env },
            stdio: 'inherit',
        });
        console.log('[NEON_BOOT] prisma migrate deploy: ok');
    }
    catch (e) {
        console.error('[NEON_BOOT] prisma migrate deploy failed:', e);
    }
}
runMigrateDeploySync();
const adapter = new PrismaBetterSqlite3({
    url: `file:${defaultDbPath}`,
});
const prisma = new PrismaClient({ adapter });
let isDbReady = false;
async function initDB() {
    console.log(`[NEON_CORE] PERSISTENCE_PATH: ${process.env.DATABASE_URL}`);
    console.log(`[NEON_CORE] AMVERA_DETECTED: ${isAmvera}`);
    console.log('[NEON_CORE] DB Init Started...');
    try {
        await prisma.$connect();
        console.log('[NEON_CORE] Database connected successfully.');
        await seedAdmin();
        isDbReady = true;
        console.log('[NEON_CORE] INIT_COMPLETE: SYSTEM_READY');
    }
    catch (e) {
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
//# sourceMappingURL=index.js.map