import jwt from 'jsonwebtoken';
export function createJwtAuth(jwtSecret) {
    return function jwtAuth(req) {
        try {
            const authHeader = req.headers.authorization;
            const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
            const bodyToken = req.body && typeof req.body === 'object' && typeof req.body.token === 'string'
                ? req.body.token
                : null;
            const token = (authHeader && authHeader.split(' ')[1]) || queryToken || bodyToken;
            if (!token)
                return null;
            return jwt.verify(token, jwtSecret);
        }
        catch {
            return null;
        }
    };
}
export const ADMIN_USERNAME = 'admin';
const PLATFORM_ADMIN_USERNAMES = new Set(['admin', 'ProsperianSun']);
export function isAdminUsername(username) {
    if (!username)
        return false;
    return PLATFORM_ADMIN_USERNAMES.has(username);
}
//# sourceMappingURL=auth.js.map