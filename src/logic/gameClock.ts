/**
 * Игровое время: 12 игровых часов = 4 реальных часа (1 игровой час = 20 мин реального).
 * Полные сутки (24 игровых часа) = 8 реальных часов.
 */

import type { NpcDayPhase } from './npcPresence';

/** Реальных миллисекунд на один игровой час */
export const MS_PER_GAME_HOUR = (4 * 60 * 60 * 1000) / 12;

export interface GameClockSnapshot {
  worldDay: number;
  /** 0–23.999 */
  hourOfDay: number;
  hour: number;
  minute: number;
  second: number;
  phase: NpcDayPhase;
  /** «14:07» */
  timeLabel: string;
  /** Короткая метка фазы для UI */
  phaseLabelRu: string;
}

function positiveMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Часы суток (0–24) из доли суток */
export function gameHourOfDayFromTotalHours(totalHours: number): number {
  return positiveMod(totalHours, 24);
}

export function gameHourMinuteSecond(hourOfDay: number): { hour: number; minute: number; second: number } {
  const sec = hourOfDay * 3600;
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return { hour: h, minute: m, second: s };
}

export function gameHourToNpcPhase(hour: number, minute: number): NpcDayPhase {
  const t = hour + minute / 60;
  if (t >= 5 && t < 10) return 'morning';
  if (t >= 10 && t < 18) return 'day';
  if (t >= 18 && t < 22) return 'evening';
  return 'night';
}

function phaseLabelRu(phase: NpcDayPhase): string {
  switch (phase) {
    case 'morning':
      return 'УТРО';
    case 'day':
      return 'ДЕНЬ';
    case 'evening':
      return 'ВЕЧЕР';
    case 'night':
      return 'НОЧЬ';
    default:
      return '';
  }
}

/**
 * @param clockAnchorMs Реальный timestamp: в этот момент игрок был на игровых 00:00 дня 1.
 */
export function getGameClockSnapshot(clockAnchorMs: number | null, nowMs: number = Date.now()): GameClockSnapshot {
  if (clockAnchorMs === null) {
    return {
      worldDay: 1,
      hourOfDay: 8,
      hour: 8,
      minute: 0,
      second: 0,
      phase: 'morning',
      timeLabel: '08:00',
      phaseLabelRu: phaseLabelRu('morning'),
    };
  }

  const elapsed = Math.max(0, nowMs - clockAnchorMs);
  const totalGameHours = elapsed / MS_PER_GAME_HOUR;
  const worldDay = 1 + Math.floor(totalGameHours / 24);
  const hourOfDay = gameHourOfDayFromTotalHours(totalGameHours);
  const { hour, minute, second } = gameHourMinuteSecond(hourOfDay);
  const phase = gameHourToNpcPhase(hour, minute);
  const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return {
    worldDay,
    hourOfDay,
    hour,
    minute,
    second,
    phase,
    timeLabel,
    phaseLabelRu: phaseLabelRu(phase),
  };
}
