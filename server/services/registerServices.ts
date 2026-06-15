import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createJwtAuth } from './auth.js';
import { mountChatService } from './chatService.js';
import { mountNriService } from './nriService.js';

export type RegisterServicesOpts = {
  prisma: PrismaClient;
  jwtSecret: string;
  sendApiError: (
    res: import('express').Response,
    status: number,
    code: string,
    message: string
  ) => void;
};

/** Регистрация микросервисов под префиксом `/neon_v1/services/*`. */
export function registerNeonServices(app: Express, opts: RegisterServicesOpts) {
  const jwtAuth = createJwtAuth(opts.jwtSecret);

  app.get('/neon_v1/services/health', (_req, res) => {
    res.json({
      status: 'ok',
      services: ['chat', 'nri', 'ice-arcade'],
    });
  });

  mountChatService(app, {
    prisma: opts.prisma,
    jwtAuth,
    sendApiError: opts.sendApiError,
  });

  mountNriService(app, {
    prisma: opts.prisma,
    jwtAuth,
    sendApiError: opts.sendApiError,
  });
}
