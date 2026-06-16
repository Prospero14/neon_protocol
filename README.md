# [NEON_PROTOCOL: Moscow Zero]

A high-fidelity cyberpunk RPG and collectible card game (CCG) engine built with React, Vite, and Node.js.

## 🚀 Fullstack Integration (Alpha 0.09)

The project includes a **Node.js/Express** backend and **Prisma/SQLite** persistence layer.

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

> [!NOTE]
> **Data persistence**: На Amvera включён `persistenceMount: /data` — SQLite (`dev.db`) и прогресс **сохраняются между redeploy**. Локально БД лежит в корне проекта; для кастомного пути задайте `NEON_DATA_DIR` или `DATABASE_URL=file:…`.

## 📚 Documentation

- **[Product pitch](docs/PITCH.md)** — возможности сервиса для презентации проекта
- **[Architecture & stack](docs/ARCHITECTURE.md)** — tools, subsystems, API, migration paths
- **[SOLID audit](docs/SOLID_AUDIT.md)** — technical debt checklist
- **[Coop cards](docs/COOP_CARD_DOCUMENTATION.md)**

## 💻 Local Development

1. Clone the repo.
2. Install dependencies: `npm install`.
3. Set up `.env` (use `.env.example` as a template).
4. Start dev environment:
  - Frontend: `npm run dev:client`
  - Backend: `npm run dev:server`