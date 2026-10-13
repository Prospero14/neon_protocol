/** Встречный взлом после серии провалов ICE. */
export const ICE_COUNTERHACK_THRESHOLD = 6;
export const ICE_COUNTERHACK_DURATION_MS = 90_000;
export const ICE_COUNTERHACK_STAGES = 3;
export const SIREN_MESSAGE = '🔊 звук полицейских сирен — ваш след перехвачен. Дека выжжена. Оставайтесь на месте.';
const STAGE_DEFS = [
    {
        id: 'reconnect',
        title: 'Смена канала',
        hint: 'Оторвись от traced proxy → новый egress.',
        correct: [
            { id: 'drop_proxy', label: 'DROP traced proxy' },
            { id: 'spin_tor', label: 'SPIN new TOR circuit' },
            { id: 'bind_egress', label: 'BIND clean egress' },
        ],
        bait: [
            { id: 'ping_corp', label: 'PING corp NOC' },
            { id: 'reuse_ip', label: 'REUSE last IP' },
            { id: 'open_cam', label: 'OPEN webcam' },
            { id: 'broadcast', label: 'BROADCAST MAC' },
            { id: 'idle', label: 'IDLE wait' },
            { id: 'dns_exfil', label: 'DNS exfil raw' },
            { id: 'reply_ice', label: 'REPLY to ICE challenge' },
        ],
    },
    {
        id: 'rekey',
        title: 'Смена пароля / ключей',
        hint: 'Ротация credentials до того, как ICE допишет session.',
        correct: [
            { id: 'revoke_sess', label: 'REVOKE old sessions' },
            { id: 'gen_keypair', label: 'GEN new keypair' },
            { id: 'set_passwd', label: 'SET deck password' },
        ],
        bait: [
            { id: 'sms_reset', label: 'SMS password reset' },
            { id: 'email_link', label: 'EMAIL magic link' },
            { id: 'share_pw', label: 'SHARE password in chat' },
            { id: 'disable_mfa', label: 'DISABLE MFA' },
            { id: 'export_key', label: 'EXPORT private key plain' },
            { id: 'same_pw', label: 'KEEP same password' },
            { id: 'post_paste', label: 'POST key to pastebin' },
        ],
    },
    {
        id: 'deny',
        title: 'Охота и отсечка',
        hint: 'Найди активность, сними признаки, отбей доступ.',
        correct: [
            { id: 'scan_deck', label: 'SCAN deck for implants' },
            { id: 'pull_sig', label: 'PULL attacker signatures' },
            { id: 'firewall_ban', label: 'FIREWALL ban signatures' },
            { id: 'kill_session', label: 'KILL remote session' },
        ],
        bait: [
            { id: 'ignore', label: 'IGNORE alerts' },
            { id: 'trust_cert', label: 'TRUST unknown cert' },
            { id: 'open_port', label: 'OPEN debug port' },
            { id: 'send_loc', label: 'SEND geo to peer' },
            { id: 'format', label: 'FORMAT /system' },
            { id: 'invite_ice', label: 'INVITE ICE deeper' },
        ],
    },
];
function mulberry(seed) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}
function shuffle(arr, seed) {
    const a = [...arr];
    const rand = mulberry(seed);
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
export function buildCounterStage(stageIndex, seed) {
    const def = STAGE_DEFS[Math.max(0, Math.min(STAGE_DEFS.length - 1, stageIndex))];
    const correct = def.correct.map((c, i) => ({
        ...c,
        correct: true,
        order: i,
    }));
    const bait = def.bait.map((c) => ({ ...c, correct: false }));
    const baitPick = shuffle(bait, seed + stageIndex * 97).slice(0, Math.max(0, 10 - correct.length));
    const commands = shuffle([...correct, ...baitPick], seed + stageIndex * 13);
    return {
        id: def.id,
        title: def.title,
        hint: def.hint,
        commands,
        need: correct.length,
    };
}
export function readCounterHack(sheet) {
    if (!sheet || typeof sheet !== 'object')
        return null;
    const raw = sheet.iceCounterHack;
    if (!raw || typeof raw !== 'object')
        return null;
    const o = raw;
    if (!o.active && !o.resolved)
        return null;
    return {
        active: !!o.active,
        startedAt: typeof o.startedAt === 'number' ? o.startedAt : Date.now(),
        endsAt: typeof o.endsAt === 'number' ? o.endsAt : Date.now() + ICE_COUNTERHACK_DURATION_MS,
        stageIndex: typeof o.stageIndex === 'number' ? o.stageIndex : 0,
        picked: Array.isArray(o.picked) ? o.picked.filter((x) => typeof x === 'string') : [],
        stageMistakes: typeof o.stageMistakes === 'number' ? o.stageMistakes : 0,
        enemyProgress: typeof o.enemyProgress === 'number' ? Math.max(0, Math.min(100, o.enemyProgress)) : 0,
        targetUserId: typeof o.targetUserId === 'string' ? o.targetUserId : undefined,
        targetName: typeof o.targetName === 'string' ? o.targetName : undefined,
        resolved: o.resolved === 'won' || o.resolved === 'lost' ? o.resolved : null,
        sirenMessage: typeof o.sirenMessage === 'string' ? o.sirenMessage : null,
    };
}
export function writeCounterHack(sheet, state) {
    const base = sheet && typeof sheet === 'object' ? { ...sheet } : {};
    if (!state) {
        const { iceCounterHack: _drop, ...rest } = base;
        return rest;
    }
    return { ...base, iceCounterHack: state };
}
export function startCounterHack(sheet, opts) {
    const now = opts.now ?? Date.now();
    const state = {
        active: true,
        startedAt: now,
        endsAt: now + ICE_COUNTERHACK_DURATION_MS,
        stageIndex: 0,
        picked: [],
        stageMistakes: 0,
        enemyProgress: 8,
        targetUserId: opts.targetUserId,
        targetName: opts.targetName,
        resolved: null,
        sirenMessage: null,
    };
    return writeCounterHack(sheet, state);
}
/** Тик врага от оставшегося времени. */
export function enemyProgressFromTime(state, now = Date.now()) {
    const span = Math.max(1, state.endsAt - state.startedAt);
    const elapsed = Math.max(0, now - state.startedAt);
    return Math.min(100, Math.round(8 + (elapsed / span) * 92));
}
export function isCounterHackExpired(state, now = Date.now()) {
    return now >= state.endsAt || state.enemyProgress >= 100;
}
export function applyCounterCommandPick(state, stage, commandId, now = Date.now()) {
    if (!state.active || state.resolved) {
        return { ok: false, state, reason: 'inactive' };
    }
    const progressed = {
        ...state,
        enemyProgress: enemyProgressFromTime(state, now),
    };
    if (isCounterHackExpired(progressed, now)) {
        return {
            ok: false,
            state: {
                ...progressed,
                active: false,
                resolved: 'lost',
                enemyProgress: 100,
                sirenMessage: SIREN_MESSAGE,
            },
            reason: 'expired',
        };
    }
    if (progressed.picked.includes(commandId)) {
        return { ok: false, state: progressed, reason: 'dup' };
    }
    const cmd = stage.commands.find((c) => c.id === commandId);
    if (!cmd)
        return { ok: false, state: progressed, reason: 'wrong' };
    const nextOrder = progressed.picked.length;
    const expected = stage.commands
        .filter((c) => c.correct)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[nextOrder];
    if (!cmd.correct || !expected || cmd.id !== expected.id) {
        const mistakes = progressed.stageMistakes + 1;
        const enemy = Math.min(100, progressed.enemyProgress + 12);
        const lost = mistakes >= 3 || enemy >= 100;
        if (lost) {
            return {
                ok: false,
                state: {
                    ...progressed,
                    stageMistakes: mistakes,
                    enemyProgress: 100,
                    active: false,
                    resolved: 'lost',
                    sirenMessage: SIREN_MESSAGE,
                },
                reason: 'wrong',
            };
        }
        return {
            ok: false,
            state: { ...progressed, stageMistakes: mistakes, enemyProgress: enemy, picked: [] },
            reason: 'wrong',
        };
    }
    const picked = [...progressed.picked, commandId];
    if (picked.length >= stage.need) {
        const nextStage = progressed.stageIndex + 1;
        if (nextStage >= ICE_COUNTERHACK_STAGES) {
            return {
                ok: true,
                state: {
                    ...progressed,
                    picked: [],
                    stageIndex: nextStage,
                    stageMistakes: 0,
                    active: false,
                    resolved: 'won',
                    enemyProgress: Math.max(0, progressed.enemyProgress - 30),
                    sirenMessage: null,
                },
                stageComplete: true,
                won: true,
            };
        }
        return {
            ok: true,
            state: {
                ...progressed,
                stageIndex: nextStage,
                picked: [],
                stageMistakes: 0,
                enemyProgress: Math.max(0, progressed.enemyProgress - 15),
            },
            stageComplete: true,
        };
    }
    return {
        ok: true,
        state: { ...progressed, picked, enemyProgress: Math.max(0, progressed.enemyProgress - 4) },
    };
}
export const DECK_CATALOG_IDS = [
    'g_cyberdeck',
    'g_cyberdeck_mid',
    'g_cyberdeck_pro',
    'g_left_deck',
];
export function isDeckCatalogId(id) {
    return DECK_CATALOG_IDS.includes(id);
}
export function inventoryHasDeck(inventory) {
    if (!Array.isArray(inventory))
        return false;
    return inventory.some((it) => it &&
        typeof it === 'object' &&
        typeof it.catalogId === 'string' &&
        isDeckCatalogId(it.catalogId));
}
/** Удалить все деки из инвентаря. */
export function brickDecksInInventory(inventory) {
    if (!Array.isArray(inventory))
        return [];
    return inventory.filter((it) => {
        if (!it || typeof it !== 'object')
            return true;
        const id = it.catalogId;
        return !(typeof id === 'string' && isDeckCatalogId(id));
    });
}
//# sourceMappingURL=iceCounterHack.js.map