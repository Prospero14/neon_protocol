import express from 'express';
import type { Request, Response, NextFunction } from 'express';
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
const PORT = 8080; // Hardcoded for Amvera stability
const JWT_SECRET = process.env.JWT_SECRET || 'neon_secret_key_2026';

// 1. Database Initialization Logic
const isAmvera = fs.existsSync('/data');
const dbPath = isAmvera ? '/data/dev.db' : './dev.db';

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
});
const prisma = new PrismaClient({ adapter });

async function initDB() {
  console.log('[NEON_CORE] Background DB Init Started...');
  try {
    await prisma.$connect();
    console.log('[NEON_CORE] Database connected successfully.');
  } catch (e) {
    console.error('[NEON_CORE] DB Connection Warning (This is expected in first seconds):', e);
  }
}

// 2. Middleware
app.use(cors());
app.use(express.json());

// --- 3. EXPLICIT API ROUTES ---

// Health check
app.get('/neon_v1/health', (req, res) => {
  res.json({
    status: 'active',
    port: PORT,
    dbPath,
    isAmvera
  });
});

// Auth Routes
app.post('/neon_v1/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { username, passwordHash: hashedPassword, gameState: { create: {} } } });
    res.status(201).json({ message: 'User created' });
  } catch (error) { res.status(400).json({ error: 'Fail' }); }
});

app.post('/neon_v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username }, include: { gameState: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Fail' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, gameState: user.gameState } });
  } catch (error) { res.status(500).json({ error: 'Fail' }); }
});

app.post('/neon_v1/game/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { hp, bits, xp, level, activeDeck, inventory, artifacts, completedQuests } = req.body;
    const updatedState = await prisma.gameState.update({
      where: { userId: decoded.userId },
      data: { hp, bits, xp, level, activeDeck, inventory, artifacts, completedQuests }
    });
    res.json(updatedState);
  } catch (error) { res.status(401).json({ error: 'Invalid' }); }
});

// --- 4. STATIC FILES AND SPA ---

const DIST = path.join(process.cwd(), 'dist');

app.use('/assets', express.static(path.join(DIST, 'assets')));
app.use(express.static(DIST));

const indexPath = path.join(DIST, 'src/index.html');

// Explicit root handler
app.get('/', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/src/');
  }
});

// Standard wildcard handler for SPA sub-pages (Express 5 compatible)
app.get('/*', (req, res) => {
  if (req.path.startsWith('/neon_v1')) return res.status(404).json({ error: 'Not found' });
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/src/');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log(`[NEON_CORE] SERVER_STABILIZED_V32_2`);
  console.log(`[NEON_CORE] PORT: ${PORT}`);
  console.log('=========================================');
  initDB();
});
