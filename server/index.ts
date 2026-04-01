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

// --- 3. DEFINITIVE DIAGNOSTICS ---
const CWD = process.cwd();

app.get('/api/health', (req, res) => {
  const rootFiles = fs.readdirSync(CWD);
  const distExists = fs.existsSync(path.join(CWD, 'dist'));
  let distFiles: string[] = [];
  if (distExists) {
    distFiles = fs.readdirSync(path.join(CWD, 'dist'));
  }

  res.json({ 
    status: 'active', 
    cwd: CWD,
    rootFiles,
    distExists,
    distFiles,
    env: process.env.NODE_ENV,
    port: PORT
  });
});

// --- 4. API (Explicit) ---
// (We keep the auth/sync routes here...)

app.post('/api/auth/register', async (req, res) => { /* ... */ res.json({msg: 'ok'}); });
app.post('/api/auth/login', async (req, res) => { /* ... */ res.json({msg: 'ok'}); });
app.post('/api/game/sync', async (req, res) => { /* ... */ res.json({msg: 'ok'}); });

// --- 5. STATIC SERVING ---
// We use an ABSOLUTE path based on CWD
const distPath = path.join(CWD, 'dist');

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

app.use(express.static(distPath));

// --- 6. CATCH-ALL ---
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If dist/index.html is missing, we show the structure to the user
    const structure = fs.readdirSync(CWD);
    res.status(500).send(`ERROR: dist/index.html not found. Project root contains: ${structure.join(', ')}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NEON_BOOT] Server on 0.0.0.0:${PORT}`);
});
