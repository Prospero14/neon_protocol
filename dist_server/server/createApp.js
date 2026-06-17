import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { mountCoopRoutes } from './coop/mountCoopRoutes.js';
import { registerNeonServices } from './services/registerServices.js';
import { mountAuthRoutes } from './routes/auth.js';
import { sendApiError } from './apiError.js';
/**
 * HTTP API (auth, sync, coop lobby) + SPA static.
 * Coop live-матчи — SQLite (CoopLiveMatch); presence-лобби — in-memory TTL.
 */
export function createApp(opts) {
    const { prisma, jwtSecret, getIsDbReady, port, databaseUrl, isAmvera } = opts;
    const app = express();
    app.use(cors());
    app.use(express.json());
    mountCoopRoutes(app, { prisma, jwtSecret, sendApiError });
    mountAuthRoutes(app, { prisma, jwtSecret, sendApiError });
    app.get('/neon_v1/health', (_req, res) => {
        const mem = process.memoryUsage();
        res.json({
            status: getIsDbReady() ? 'active' : 'initializing',
            port,
            dbPath: databaseUrl,
            isAmvera,
            memoryMb: {
                rss: Math.round(mem.rss / 1024 / 1024),
                heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
                heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
                external: Math.round(mem.external / 1024 / 1024),
            },
        });
    });
    registerNeonServices(app, { prisma, jwtSecret, sendApiError });
    const DIST = path.join(process.cwd(), 'dist');
    const sendHtmlNoCache = (res, file) => {
        res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
        res.sendFile(file);
    };
    app.use('/assets', express.static(path.join(DIST, 'assets'), {
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        },
    }));
    app.use(express.static(DIST, {
        setHeaders: (_res, filePath) => {
            if (filePath.endsWith('.html')) {
                _res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
            }
        },
    }));
    const indexPath = fs.existsSync(path.join(DIST, 'index.html'))
        ? path.join(DIST, 'index.html')
        : path.join(DIST, 'src/index.html');
    app.get('/', (_req, res) => {
        if (fs.existsSync(indexPath)) {
            sendHtmlNoCache(res, indexPath);
        }
        else {
            res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
        }
    });
    app.get(/.*/, (req, res) => {
        if (req.path.startsWith('/neon_v1'))
            return sendApiError(res, 404, 'API_NOT_FOUND', 'Маршрут не найден.');
        if (fs.existsSync(indexPath)) {
            sendHtmlNoCache(res, indexPath);
        }
        else {
            res.status(500).send('CRITICAL ERROR: Main index.html missing in dist/');
        }
    });
    return app;
}
//# sourceMappingURL=createApp.js.map