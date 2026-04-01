import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'neon_secret_key_2026';

app.use(cors());
app.use(express.json());

// --- AUTH ROUTES ---

// Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        gameState: {
          create: {} // Create default game state
        }
      }
    });

    res.status(201).json({ message: 'User created' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { gameState: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        gameState: user.gameState
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- GAME STATE ROUTES ---

// Sync/Save Game State
app.post('/api/game/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { hp, bits, xp, level, activeDeck, inventory, artifacts, completedQuests } = req.body;

    const updatedState = await prisma.gameState.update({
      where: { userId: decoded.userId },
      data: {
        hp,
        bits,
        xp,
        level,
        activeDeck,
        inventory,
        artifacts,
        completedQuests
      }
    });

    res.json(updatedState);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`[NEON_CORE] Server active on port ${PORT}`);
});
