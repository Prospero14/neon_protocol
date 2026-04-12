console.log('[NEON_BOOT] Server process starting...');
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 8080; // Total sync with Amvera Ingress
const JWT_SECRET = process.env.JWT_SECRET || 'neon_secret_key_2026';
// 1. Database Initialization Logic
const isAmvera = fs.existsSync('/data');
const defaultDbPath = isAmvera ? '/data/dev.db' : path.join(process.cwd(), 'dev.db');
const defaultDbUrl = `file:${defaultDbPath}`;
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = defaultDbUrl;
}
console.log(`[NEON_BOOT] RESOLVED_DATABASE_URL: ${process.env.DATABASE_URL}`);
console.log(`[NEON_BOOT] RESOLVED_FILE_PATH: ${defaultDbPath}`);
const adapter = new PrismaBetterSqlite3({
    url: `file:${defaultDbPath}`
});
const prisma = new PrismaClient({ adapter });
let isDbReady = false;
async function initDB() {
    console.log(`[NEON_CORE] PERSISTENCE_PATH: ${process.env.DATABASE_URL}`);
    console.log(`[NEON_CORE] AMVERA_DETECTED: ${isAmvera}`);
    console.log('[NEON_CORE] Background DB Init Started...');
    try {
        await prisma.$connect();
        console.log('[NEON_CORE] Database connected successfully.');
        await seedAdmin();
        isDbReady = true;
        console.log('[NEON_CORE] INIT_COMPLETE: SYSTEM_READY');
    }
    catch (e) {
        console.error('[NEON_CORE] DB Connection Error:', e);
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
            { id: 'soft_coffee', count: 4 }
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
                        intel: ['EU Syntax']
                    }
                }
            }
        });
    }
}
// 2. Middleware
app.use(cors());
app.use(express.json());
// --- 3. EXPLICIT API ROUTES ---
// Health check
app.get('/neon_v1/health', (req, res) => {
    res.json({
        status: isDbReady ? 'active' : 'initializing',
        port: PORT,
        dbPath: process.env.DATABASE_URL,
        isAmvera
    });
});
// Auth Routes
app.post('/neon_v1/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        // Default starter cards for Script-Kiddie
        const starterDeck = [
            { id: 'script_ping', count: 1 },
            { id: 'script_grep', count: 1 },
            { id: 'script_wash_logs', count: 1 },
            { id: 'soft_coffee', count: 1 }
        ];
        await prisma.user.create({
            data: {
                username,
                passwordHash: hashedPassword,
                gameState: {
                    create: {
                        bits: 150,
                        ramPool: 1.0,
                        stress: 0,
                        maxStress: 100,
                        activeDeck: starterDeck,
                        inventory: starterDeck,
                        artifacts: [],
                        completedQuests: [],
                        reputation: {},
                        intel: []
                    }
                }
            }
        });
        res.status(201).json({ message: 'User created' });
    }
    catch (error) {
        console.error('Registration Error:', error);
        const msg = error.code === 'P2002' ? 'Identity already exists.' : 'Identity creation failed. Subsystem error.';
        res.status(400).json({ error: msg });
    }
});
app.post('/neon_v1/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username }, include: { gameState: true } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash)))
            return res.status(401).json({ error: 'Fail' });
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, gameState: user.gameState } });
    }
    catch (error) {
        res.status(500).json({ error: 'Fail' });
    }
});
app.post('/neon_v1/game/sync', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ error: 'No token' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const { stress, maxStress, bits, xp, level, activeDeck, inventory, artifacts, completedQuests } = req.body;
        const updatedState = await prisma.gameState.update({
            where: { userId: decoded.userId },
            data: { stress, maxStress, bits, xp, level, activeDeck, inventory, artifacts, completedQuests }
        });
        res.json(updatedState);
    }
    catch (error) {
        console.error('Sync Error:', error);
        res.status(401).json({ error: 'Invalid' });
    }
});
// --- COOP LOBBY (in-memory; один инстанс сервера) ---
const LOBBY_TTL_MS = 50_000;
const MAX_PARTY = 4;
const MAX_CHAT = 120;
const lobbyByUser = new Map();
const parties = new Map();
const chatLog = [];
function lobbyAuth(req) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return null;
        const token = authHeader.split(' ')[1];
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
function pruneLobbyUsers() {
    const now = Date.now();
    for (const [uid, u] of lobbyByUser) {
        if (now - u.lastSeen > LOBBY_TTL_MS) {
            lobbyByUser.delete(uid);
            const p = u.partyId ? parties.get(u.partyId) : null;
            if (p) {
                p.memberIds = p.memberIds.filter((id) => id !== uid);
                if (p.memberIds.length === 0)
                    parties.delete(p.id);
                else if (p.hostId === uid) {
                    p.hostId = p.memberIds[0];
                }
            }
        }
    }
}
function serializeParty(partyId, selfId) {
    if (!partyId)
        return null;
    const p = parties.get(partyId);
    if (!p)
        return null;
    return {
        id: p.id,
        hostId: p.hostId,
        isHost: p.hostId === selfId,
        members: p.memberIds.map((mid) => {
            const u = lobbyByUser.get(mid);
            return {
                userId: mid,
                displayName: u?.displayName ?? mid,
                coopRole: u?.coopRole ?? '?',
                clientUsername: u?.clientUsername ?? '',
            };
        }),
    };
}
app.post('/neon_v1/coop/heartbeat', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth)
        return res.status(401).json({ error: 'No token' });
    const { displayName, coopRole, clientUsername } = req.body;
    if (typeof displayName !== 'string' || !displayName.trim()) {
        return res.status(400).json({ error: 'displayName required' });
    }
    const role = typeof coopRole === 'string' ? coopRole : 'developer';
    const cname = typeof clientUsername === 'string' ? clientUsername : '';
    pruneLobbyUsers();
    const prev = lobbyByUser.get(auth.userId);
    lobbyByUser.set(auth.userId, {
        userId: auth.userId,
        clientUsername: cname,
        displayName: displayName.trim().slice(0, 48),
        coopRole: role,
        lastSeen: Date.now(),
        partyId: prev?.partyId ?? null,
    });
    const online = [...lobbyByUser.entries()]
        .filter(([id]) => id !== auth.userId)
        .map(([id, u]) => ({
        userId: id,
        displayName: u.displayName,
        coopRole: u.coopRole,
        clientUsername: u.clientUsername,
    }));
    res.json({
        ok: true,
        online,
        party: serializeParty(lobbyByUser.get(auth.userId)?.partyId ?? null, auth.userId),
        chat: chatLog.slice(-40),
    });
});
app.get('/neon_v1/coop/state', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth)
        return res.status(401).json({ error: 'No token' });
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    const online = [...lobbyByUser.entries()]
        .filter(([id]) => id !== auth.userId)
        .map(([id, u]) => ({
        userId: id,
        displayName: u.displayName,
        coopRole: u.coopRole,
        clientUsername: u.clientUsername,
    }));
    res.json({
        online,
        party: serializeParty(me?.partyId ?? null, auth.userId),
        chat: chatLog.slice(-40),
    });
});
app.post('/neon_v1/coop/chat', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth)
        return res.status(401).json({ error: 'No token' });
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim())
        return res.status(400).json({ error: 'text' });
    const me = lobbyByUser.get(auth.userId);
    if (!me)
        return res.status(400).json({ error: 'Heartbeat first' });
    const entry = {
        id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId: auth.userId,
        displayName: me.displayName,
        coopRole: me.coopRole,
        text: text.trim().slice(0, 500),
        ts: Date.now(),
    };
    chatLog.push(entry);
    while (chatLog.length > MAX_CHAT)
        chatLog.shift();
    res.json({ ok: true, message: entry });
});
app.post('/neon_v1/coop/invite', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth)
        return res.status(401).json({ error: 'No token' });
    const { targetDisplayName } = req.body;
    if (typeof targetDisplayName !== 'string' || !targetDisplayName.trim()) {
        return res.status(400).json({ error: 'targetDisplayName' });
    }
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    if (!me)
        return res.status(400).json({ error: 'Heartbeat first' });
    const needle = targetDisplayName.trim().toLowerCase();
    let targetId = null;
    for (const [id, u] of lobbyByUser) {
        if (id === auth.userId)
            continue;
        if (u.displayName.toLowerCase() === needle) {
            targetId = id;
            break;
        }
    }
    if (!targetId)
        return res.status(404).json({ error: 'Player not online' });
    const target = lobbyByUser.get(targetId);
    if (!target)
        return res.status(404).json({ error: 'Gone' });
    if (target.partyId && target.partyId !== me.partyId) {
        return res.status(400).json({ error: 'Target in another party' });
    }
    let partyId = me.partyId;
    if (!partyId) {
        partyId = `party_${auth.userId}_${Date.now()}`;
        parties.set(partyId, { id: partyId, hostId: auth.userId, memberIds: [auth.userId] });
        me.partyId = partyId;
    }
    const party = parties.get(partyId);
    if (!party)
        return res.status(500).json({ error: 'party' });
    if (party.memberIds.length >= MAX_PARTY)
        return res.status(400).json({ error: 'Party full' });
    if (!party.memberIds.includes(targetId)) {
        if (target.partyId && target.partyId !== partyId) {
            return res.status(400).json({ error: 'Target in another party' });
        }
        party.memberIds.push(targetId);
        target.partyId = partyId;
    }
    res.json({ ok: true, party: serializeParty(partyId, auth.userId) });
});
app.post('/neon_v1/coop/party/leave', (req, res) => {
    const auth = lobbyAuth(req);
    if (!auth)
        return res.status(401).json({ error: 'No token' });
    pruneLobbyUsers();
    const me = lobbyByUser.get(auth.userId);
    if (!me?.partyId)
        return res.json({ ok: true, party: null });
    const p = parties.get(me.partyId);
    if (p) {
        p.memberIds = p.memberIds.filter((id) => id !== auth.userId);
        if (p.memberIds.length === 0) {
            parties.delete(p.id);
        }
        else if (p.hostId === auth.userId) {
            p.hostId = p.memberIds[0];
        }
    }
    me.partyId = null;
    res.json({ ok: true, party: null });
});
// --- 4. STATIC FILES AND SPA ---
const DIST = path.join(process.cwd(), 'dist');
app.use('/assets', express.static(path.join(DIST, 'assets')));
app.use(express.static(DIST));
const indexPath = fs.existsSync(path.join(DIST, 'index.html'))
    ? path.join(DIST, 'index.html')
    : path.join(DIST, 'src/index.html');
// Explicit root handler
app.get('/', (req, res) => {
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
    }
});
// Standard wildcard handler for SPA sub-pages (Express 5 compatible)
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/neon_v1'))
        return res.status(404).json({ error: 'Not found' });
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
    }
});
app.listen(PORT, '0.0.0.0', () => {
    console.log('=========================================');
    console.log(`[NEON_CORE] SERVER_STABILIZED_V32_3`);
    console.log(`[NEON_CORE] PORT: ${PORT}`);
    console.log('=========================================');
    // Decouple DB init from listener startup to avoid 502 Bad Gateway
    initDB().catch(err => {
        console.error('[NEON_CORE] CRITICAL_INIT_FAILED:', err);
    });
});
//# sourceMappingURL=index.js.map