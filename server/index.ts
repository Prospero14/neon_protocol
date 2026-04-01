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

// --- 3. PATH PROBE ---
const CWD = process.cwd();
const DIST_V1 = path.resolve(CWD, 'dist');
const DIST_V2 = path.resolve(__dirname, '../dist');

console.log('[NEON_PROBE] CWD:', CWD);
console.log('[NEON_PROBE] __dirname:', __dirname);
console.log('[NEON_PROBE] DIST_V1 (CWD based):', DIST_V1, fs.existsSync(DIST_V1) ? '(FOUND)' : '(NOT FOUND)');
console.log('[NEON_PROBE] DIST_V2 (DIR based):', DIST_V2, fs.existsSync(DIST_V2) ? '(FOUND)' : '(NOT FOUND)');

const distPath = fs.existsSync(DIST_V1) ? DIST_V1 : DIST_V2;

// --- 4. API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active', 
    distFound: fs.existsSync(distPath),
    distPath: distPath
  });
});

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

// --- 5. STATIC FILES AND SPA FALLBACK ---

// Assets should be explicitly handled
app.use('/assets', express.static(path.join(distPath, 'assets')));
app.use(express.static(distPath));

// Final SPA Fallback: RegExp for accuracy
app.get(/^\/(?!api).*/, (req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log(`[SPA] Solving path ${req.path} -> ${indexPath}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If dist/index.html is missing, check if it's in the root (but warn)
    const rootIndex = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(rootIndex)) {
      console.warn('[SPA] dist/index.html missing, falling back to root index.html (DEV VERSION!)');
      res.sendFile(rootIndex);
    } else {
      res.status(500).send(`Production build missing at ${indexPath}`);
    }
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[NEON_CORE] Fullstack active on port ${PORT}`);
});
