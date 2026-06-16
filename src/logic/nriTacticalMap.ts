/** Пресеты тактических схем (вид сверху) и экспорт в SVG. */

import type { NriClassId } from './nriClasses';

export type TacticalPresetId =
  | 'alley'
  | 'bar'
  | 'lobby'
  | 'street'
  | 'entrance'
  | 'house'
  | 'roof'
  | 'geometry';

export type TacticalPreset = {
  id: TacticalPresetId;
  label: string;
  hint: string;
};

export const TACTICAL_PRESETS: TacticalPreset[] = [
  { id: 'alley', label: 'Переулок', hint: 'Узкий проход между фасадами' },
  { id: 'bar', label: 'Бар', hint: 'Зал, стойка, столы' },
  { id: 'lobby', label: 'Фойе БЦ', hint: 'Ресепшен и открытое пространство' },
  { id: 'street', label: 'Оживлённая улица', hint: 'Проезжая часть и тротуары' },
  { id: 'entrance', label: 'Вход в дом', hint: 'Подъезд и площадка у двери' },
  { id: 'house', label: 'Дом и двор', hint: 'Строение и зона вокруг' },
  { id: 'roof', label: 'Крыша', hint: 'Плоская крыша с техникой' },
  { id: 'geometry', label: 'Геометрия', hint: 'Сетка — расставьте фигуры сами' },
];

export type TacticalTokenKind = 'player' | 'enemy';

export type TacticalToken = {
  id: string;
  kind: TacticalTokenKind;
  label: string;
  classId?: NriClassId;
  userId?: string;
  combatantId?: string;
  x: number;
  y: number;
};

export type TacticalObstacle = {
  id: string;
  shape: 'rect' | 'circle';
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TacticalMapState = {
  presetId: TacticalPresetId;
  tokens: TacticalToken[];
  obstacles: TacticalObstacle[];
};

export const TACTICAL_BOARD_W = 640;
export const TACTICAL_BOARD_H = 360;

export const CLASS_TOKEN_COLORS: Record<NriClassId, { fill: string; stroke: string; glyph: string }> = {
  daimyo: { fill: '#5c1a1a', stroke: '#ff7777', glyph: 'Д' },
  doc: { fill: '#1a4a3a', stroke: '#66ffbb', glyph: '+' },
  merc: { fill: '#4a4a18', stroke: '#dddd66', glyph: 'Н' },
  hacker: { fill: '#1a3560', stroke: '#77bbff', glyph: 'Х' },
  detective: { fill: '#4a3818', stroke: '#ffcc77', glyph: 'С' },
  fixer: { fill: '#38184a', stroke: '#cc77ff', glyph: 'П' },
};

const ENEMY_STYLE = { fill: '#4a1010', stroke: '#ff4444', glyph: '×' };

export function newTokenId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function presetBackgroundSvg(presetId: TacticalPresetId): string {
  const w = TACTICAL_BOARD_W;
  const h = TACTICAL_BOARD_H;
  const base = `<rect width="${w}" height="${h}" fill="#0d1118"/>`;

  switch (presetId) {
    case 'alley':
      return `${base}
        <rect x="0" y="0" width="140" height="${h}" fill="#151b24"/>
        <rect x="${w - 140}" y="0" width="140" height="${h}" fill="#151b24"/>
        <rect x="130" y="0" width="20" height="${h}" fill="#1e2630" opacity="0.6"/>
        <rect x="${w - 150}" y="0" width="20" height="${h}" fill="#1e2630" opacity="0.6"/>
        <rect x="150" y="${h - 28}" width="${w - 300}" height="28" fill="#222a35"/>`;
    case 'bar':
      return `${base}
        <rect x="0" y="0" width="${w}" height="${h}" fill="#12161e"/>
        <rect x="40" y="40" width="${w - 80}" height="70" fill="#2a1f14"/>
        <rect x="60" y="130" width="80" height="50" fill="#1a2030" rx="4"/>
        <rect x="180" y="140" width="70" height="45" fill="#1a2030" rx="4"/>
        <rect x="300" y="125" width="90" height="55" fill="#1a2030" rx="4"/>
        <rect x="450" y="135" width="75" height="48" fill="#1a2030" rx="4"/>`;
    case 'lobby':
      return `${base}
        <rect x="0" y="0" width="${w}" height="${h}" fill="#141a22"/>
        <rect x="250" y="60" width="140" height="50" fill="#2a3545"/>
        <rect x="40" y="${h - 50}" width="${w - 80}" height="30" fill="#1c2430"/>
        <circle cx="120" cy="120" r="35" fill="#1a2230"/>
        <circle cx="${w - 120}" cy="120" r="35" fill="#1a2230"/>`;
    case 'street':
      return `${base}
        <rect x="0" y="70" width="90" height="${h - 140}" fill="#141820"/>
        <rect x="${w - 90}" y="70" width="90" height="${h - 140}" fill="#141820"/>
        <rect x="90" y="85" width="${w - 180}" height="${h - 170}" fill="#252d38"/>
        <line x1="90" y1="${h / 2}" x2="${w - 90}" y2="${h / 2}" stroke="#3a4555" stroke-width="2" stroke-dasharray="18 14"/>`;
    case 'entrance':
      return `${base}
        <rect x="180" y="30" width="280" height="200" fill="#181e28"/>
        <rect x="280" y="120" width="80" height="110" fill="#0a0e14"/>
        <rect x="0" y="${h - 60}" width="${w}" height="60" fill="#1a222c"/>`;
    case 'house':
      return `${base}
        <rect x="0" y="0" width="${w}" height="${h}" fill="#10151c"/>
        <rect x="200" y="80" width="240" height="180" fill="#1c2430"/>
        <polygon points="200,80 320,20 440,80" fill="#2a3340"/>
        <rect x="295" y="170" width="50" height="90" fill="#0c1018"/>`;
    case 'roof':
      return `${base}
        <rect x="0" y="0" width="${w}" height="${h}" fill="#1a1f28"/>
        <rect x="80" y="100" width="90" height="60" fill="#2a3038"/>
        <rect x="280" y="70" width="110" height="75" fill="#2a3038"/>
        <rect x="480" y="120" width="70" height="55" fill="#2a3038"/>
        <line x1="0" y1="${h - 20}" x2="${w}" y2="${h - 20}" stroke="#3a4550" stroke-width="3"/>`;
    case 'geometry':
    default:
      return `${base}
        <defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1e2836" stroke-width="1"/>
        </pattern></defs>
        <rect width="${w}" height="${h}" fill="url(#grid)"/>`;
  }
}

function tokenSvg(tok: TacticalToken): string {
  const r = tok.kind === 'player' ? 16 : 14;
  const style =
    tok.kind === 'player' && tok.classId
      ? CLASS_TOKEN_COLORS[tok.classId]
      : ENEMY_STYLE;
  const cx = (tok.x / 100) * TACTICAL_BOARD_W;
  const cy = (tok.y / 100) * TACTICAL_BOARD_H;
  const shape =
    tok.kind === 'enemy'
      ? `<polygon points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"/>`
      : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2.5"/>`;
  const label = tok.label.slice(0, 14).replace(/[<>&"]/g, '');
  return `${shape}
    <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#eef4ff" font-size="11" font-family="monospace">${style.glyph}</text>
    <text x="${cx}" y="${cy + r + 14}" text-anchor="middle" fill="#b8c8e0" font-size="10" font-family="sans-serif">${label}</text>`;
}

function obstacleSvg(o: TacticalObstacle): string {
  const x = (o.x / 100) * TACTICAL_BOARD_W;
  const y = (o.y / 100) * TACTICAL_BOARD_H;
  const w = (o.w / 100) * TACTICAL_BOARD_W;
  const h = (o.h / 100) * TACTICAL_BOARD_H;
  if (o.shape === 'circle') {
    return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#2a3545" stroke="#556677" stroke-width="1.5" opacity="0.9"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2a3545" stroke="#556677" stroke-width="1.5" opacity="0.9" rx="2"/>`;
}

export function buildTacticalSvg(state: TacticalMapState, opts?: { includeTokens?: boolean }): string {
  const includeTokens = opts?.includeTokens !== false;
  const preset = TACTICAL_PRESETS.find((p) => p.id === state.presetId);
  const bg = presetBackgroundSvg(state.presetId);
  const obstacles = state.obstacles.map(obstacleSvg).join('\n');
  const tokens = includeTokens ? state.tokens.map(tokenSvg).join('\n') : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TACTICAL_BOARD_W} ${TACTICAL_BOARD_H}" width="${TACTICAL_BOARD_W}" height="${TACTICAL_BOARD_H}">
  <title>${preset?.label ?? 'Схема'}</title>
  ${bg}
  ${obstacles}
  ${tokens}
</svg>`;
}

export function tacticalSummaryText(state: TacticalMapState): string {
  const preset = TACTICAL_PRESETS.find((p) => p.id === state.presetId);
  const players = state.tokens.filter((t) => t.kind === 'player');
  const enemies = state.tokens.filter((t) => t.kind === 'enemy');
  const lines = [`📍 Схема боя — ${preset?.label ?? state.presetId}`];
  if (players.length) {
    lines.push('Игроки: ' + players.map((t) => `${t.label} (${Math.round(t.x)}%;${Math.round(t.y)}%)`).join(', '));
  }
  if (enemies.length) {
    lines.push('Враги: ' + enemies.map((t) => `${t.label} (${Math.round(t.x)}%;${Math.round(t.y)}%)`).join(', '));
  }
  if (state.obstacles.length) {
    lines.push(`Укрытия/стены: ${state.obstacles.length}`);
  }
  lines.push('Откройте прикреплённый файл для карты.');
  return lines.join('\n').slice(0, 480);
}
