import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type JwtAuth = { userId: string };

export function createJwtAuth(jwtSecret: string) {
  return function jwtAuth(req: Request): JwtAuth | null {
    try {
      const authHeader = req.headers.authorization;
      const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
      const bodyToken =
        req.body && typeof req.body === 'object' && typeof (req.body as Record<string, unknown>).token === 'string'
          ? ((req.body as Record<string, unknown>).token as string)
          : null;
      const token = (authHeader && authHeader.split(' ')[1]) || queryToken || bodyToken;
      if (!token) return null;
      return jwt.verify(token, jwtSecret) as JwtAuth;
    } catch {
      return null;
    }
  };
}

export type ApiErrorSender = (res: Response, status: number, code: string, message: string) => void;

export const ADMIN_USERNAME = 'admin';

export function isAdminUsername(username: string | undefined | null): boolean {
  return username === ADMIN_USERNAME;
}
