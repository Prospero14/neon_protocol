import { mountNriLoreTravelRoutes } from './nriLoreTravel.js';
import { mountNriItemTransferRoutes } from './nriItemTransfer.js';
import { mountNriCombatantRoutes } from './nriCombatantRoutes.js';
import { mountNriIceWalletRoutes } from './nriIceWalletRoutes.js';
import { mountNriPlayerRoutes } from './nriPlayerRoutes.js';
import { mountNriPresetRoutes } from './nriPresetRoutes.js';
import { mountNriMapRoutes } from './nriMapRoutes.js';
import { mountNriVaultRoutes } from './nriVaultRoutes.js';
import { mountNriNpcRoutes } from './nriNpcRoutes.js';
import { mountNriCyberRoutes } from './nriCyberRoutes.js';
import { mountNriSessionLobbyRoutes } from './nriSessionLobbyRoutes.js';
import { mountNriVehicleRoutes } from './nriVehicleRoutes.js';
import { mountNriScenarioRoutes } from './nriScenarioRoutes.js';
import { parseNriJsonField, requireNriHost, resolveNriSession } from './nriSessionHelpers.js';
/** Точка монтирования всех маршрутов столов НРИ. */
export function mountNriService(app, deps) {
    const { prisma, jwtAuth, sendApiError } = deps;
    async function resolveUser(auth) {
        return prisma.user.findUnique({
            where: { id: auth.userId },
            select: { id: true, username: true },
        });
    }
    const resolveSession = (code) => resolveNriSession(prisma, code);
    const requireHost = requireNriHost;
    const nriCtx = {
        prisma,
        jwtAuth,
        sendApiError,
        resolveUser,
        resolveSession: (code) => resolveNriSession(prisma, code),
        requireHost: requireNriHost,
    };
    mountNriSessionLobbyRoutes(app, nriCtx);
    mountNriIceWalletRoutes(app, nriCtx);
    mountNriPlayerRoutes(app, nriCtx);
    mountNriPresetRoutes(app, nriCtx);
    mountNriMapRoutes(app, nriCtx);
    mountNriVaultRoutes(app, nriCtx);
    mountNriNpcRoutes(app, nriCtx);
    mountNriCyberRoutes(app, nriCtx);
    mountNriVehicleRoutes(app, nriCtx);
    mountNriScenarioRoutes(app, nriCtx);
    mountNriCombatantRoutes(app, {
        prisma,
        jwtAuth,
        sendApiError,
        resolveSession,
        resolveUser,
        requireHost,
        parseJsonField: parseNriJsonField,
    });
    mountNriLoreTravelRoutes(app, {
        prisma,
        jwtAuth,
        sendApiError,
        resolveSession,
        resolveUser,
        requireHost,
    });
    mountNriItemTransferRoutes(app, {
        prisma,
        jwtAuth,
        sendApiError,
        resolveSession,
        resolveUser,
    });
}
//# sourceMappingURL=nriService.js.map