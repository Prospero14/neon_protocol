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

// --- 3. PATH & DIAGNOSTICS ---
const CWD = process.cwd();
const distPath = path.resolve(CWD, 'dist');

console.log('[NEON_BOOT] CWD:', CWD);
console.log('[NEON_BOOT] Target Dist Path:', distPath);

// --- 4. API ROUTES (Explicit Matching) ---

app.get('/api/health', (req, res) => {
  let distFiles: string[] = [];
  try {
    if (fs.existsSync(distPath)) {
      distFiles = fs.readdirSync(distPath);
    }
  } catch (e) {
    console.error('[NEON_ERROR] Failed to read dist:', e);
  }

  res.json({ 
    status: 'active', 
    cwd: CWD,
    distPath: distPath,
    distExists: fs.existsSync(distPath),
    distFiles
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
    await prisma.gameState.update({
      where: { userId: decoded.userId },
      data: { hp, bits, xp, level, activeDeck, inventory, artifacts, completedQuests }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --- 5. STATIC FILES (Priority) ---

// Serve /assets explicitly
app.use('/assets', express.static(path.join(distPath, 'assets'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  }
}));

// Serve root level static files (favicon, etc)
app.use(express.static(distPath));

// --- 6. SPA FALLBACK (Final Catch-all) ---

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  // Never catch API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If dist/index.html is missing, we are in trouble
    console.error(`[NEON_CRITICAL] Missing index.html at ${indexPath}`);
    res.status(500).send('Application build folder (dist/) not found. Check Timeweb Build settings.');
  }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NEON_CORE] Fullstack active on 0.0.0.0:${PORT}`);
});
