# [NEON_PROTOCOL: Moscow Zero]

A high-fidelity cyberpunk RPG and collectible card game (CCG) engine built with React, Vite, and Node.js.

## 🚀 Fullstack Integration (Alpha 0.09)

The project now includes a **Node.js/Express** backend and **Prisma/PostgreSQL** persistence layer.

- **Authentication**: JWT-based secure session management.
- **Persistence**: Player HP, Bits, XP, Deck, and Artifacts are synced to the database.

## 🚀 Zero-Cost Deployment (Timeweb Cloud App Platform)

The project now uses **SQLite**, so you don't need to pay for a separate database cluster. 

1. **GitHub Connection**:
  - In Timeweb Cloud, go to **[ App Platform ]**.
  - Create a service from your repository: `Prospero14/neon_protocol`.
2. **Framework & Environment**:
  - Select **[ Другой ]** (Other).
  - Ensure the runtime is **Node.js 24**.
3. **Build & Start Settings**:
  - **Build Command**: `npm run build:full`
  - **Start Command**: `npm start`
4. **Environment Variables**:
  - **DATABASE_URL**: Leave blank (it will use the local `file:./dev.db`).
  - **JWT_SECRET**: Add any random string (e.g., `my_secret_123`).

> [!CAUTION]
> **Data Persistence**: Since SQLite is a local file, players and their progress will be **reset whenever you push a new update** to GitHub. This is perfect for testing without costs!

## 💻 Local Development

1. Clone the repo.
2. Install dependencies: `npm install`.
3. Set up `.env` (use `.env.example` as a template).
4. Start dev environment:
  - Frontend: `npm run dev:client`
  - Backend: `npm run dev:server`