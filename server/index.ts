console.log('[NEON_BOOT] Server process starting...');
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
const PORT = Number(process.env.PORT) || 8080; // Total sync with Amvera Ingress
const JWT_SECRET = process.env.JWT_SECRET || 'neon_secret_key_2026';

// 1. Database Initialization Logic
const isAmvera = fs.existsSync('/data');
const dbPath = isAmvera ? '/data/dev.db' : './dev.db';

const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
});
const prisma = new PrismaClient({ adapter });

async function initDB() {
  console.log(`[NEON_CORE] PERSISTENCE_PATH: ${dbPath}`);
  console.log(`[NEON_CORE] AMVERA_DETECTED: ${isAmvera}`);
  console.log('[NEON_CORE] Background DB Init Started...');
  try {
    await prisma.$connect();
    console.log('[NEON_CORE] Database connected successfully.');
    await seedAdmin();
  } catch (e) {
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
  } catch (error: any) { 
    console.error('Registration Error:', error);
    const msg = error.code === 'P2002' ? 'Identity already exists.' : 'Identity creation failed. Subsystem error.';
    res.status(400).json({ error: msg }); 
  }
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
    const { stress, maxStress, bits, xp, level, activeDeck, inventory, artifacts, completedQuests } = req.body;
    const updatedState = await prisma.gameState.update({
      where: { userId: decoded.userId },
      data: { stress, maxStress, bits, xp, level, activeDeck, inventory, artifacts, completedQuests }
    });
    res.json(updatedState);
  } catch (error) { 
    console.error('Sync Error:', error);
    res.status(401).json({ error: 'Invalid' }); 
  }
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
  } else {
    res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
  }
});

// Standard wildcard handler for SPA sub-pages (Express 5 compatible)
app.get('*splat', (req, res) => {
  if (req.path.startsWith('/neon_v1')) return res.status(404).json({ error: 'Not found' });
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('=========================================');
  console.log(`[NEON_CORE] SERVER_STABILIZED_V32_2`);
  console.log(`[NEON_CORE] PORT: ${PORT}`);
  console.log('=========================================');
  initDB();
});
