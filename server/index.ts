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
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'neon_secret_key_2026';

// 1. Database
const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

// 2. Middleware
app.use(cors());
app.use(express.json());

// --- 3. API ROUTES (Explicit First) ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active', 
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    cwd: process.cwd()
  });
});

// Registration
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, passwordHash: hashedPassword, gameState: { create: {} } }
    });
    res.status(201).json({ message: 'User created' });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username }, include: { gameState: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, gameState: user.gameState } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Sync
app.post('/api/game/sync', async (req: Request, res: Response) => {
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
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- 4. STATIC FILES AND SPA FALLBACK ---

// Absolute path to dist folder
const distPath = path.resolve(process.cwd(), 'dist');
console.log(`[NEON_BOOT] Static folder path: ${distPath}`);

// Primary static serving
app.use(express.static(distPath));

// Final SPA Fallback: Use a Regular Expression to avoid path-to-regexp v8 string issues
// This matches everything EXCEPT paths starting with /api
app.get(/^\/(?!api).*/, (req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`[NEON_ERROR] index.html not found at: ${indexPath}`);
    res.status(500).send('Production build (dist/index.html) missing. Run build first.');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[NEON_CORE] Fullstack active on port ${PORT}`);
});
