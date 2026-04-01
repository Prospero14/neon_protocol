# [NEON_PROTOCOL: Moscow Zero]

A high-fidelity cyberpunk RPG and collectible card game (CCG) engine built with React, Vite, and Node.js.

## 🚀 Fullstack Integration (Alpha 0.09)
The project now includes a **Node.js/Express** backend and **Prisma/PostgreSQL** persistence layer.
- **Authentication**: JWT-based secure session management.
- **Persistence**: Player HP, Bits, XP, Deck, and Artifacts are synced to the database.

## 🛠️ Deployment (Timeweb Cloud App Platform)
To deploy this project to the RU segment using Timeweb Cloud:

1. **GitHub Connection**:
   - In Timeweb Cloud, go to **[ App Platform ]**.
   - Create a new service from **[ GitHub ]**.
   - Select the repository: `Prospero14/neon_protocol`.

2. **Framework Selection**:
   - Select **[ Другой ]** (Other) framework.
   - Ensure the runtime is **Node.js 24**.

3. **Build & Start Settings**:
   - **Build Command**: `npm run build:full`
   - **Start Command**: `npm start`
   - **Output Directory**: Leave empty or root (since the server handle static files).

4. **Environment Variables**:
   - Create a **PostgreSQL** instance in Timeweb "Базы данных".
   - In the App Platform settings, add `DATABASE_URL` (format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public`).
   - Add `JWT_SECRET` (a random string for token security).

## 💻 Local Development
1. Clone the repo.
2. Install dependencies: `npm install`.
3. Set up `.env` (use `.env.example` as a template).
4. Start dev environment:
   - Frontend: `npm run dev:client`
   - Backend: `npm run dev:server`
   ```
