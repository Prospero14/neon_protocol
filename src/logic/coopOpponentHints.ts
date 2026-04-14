/**
 * Кратко: что делает ИИ против каждой роли в коопе (один оппонент, разные акценты модификаторов).
 */
import type { CoopRole } from './sessionMode';

export function coopOpponentHintTitle(role: CoopRole): string {
  switch (role) {
    case 'developer':
      return 'Оппонент vs DEV';
    case 'qa':
      return 'Оппонент vs QA';
    case 'admin':
      return 'Оппонент vs ADMIN';
    case 'pm':
      return 'Оппонент vs PM';
    default:
      return 'Оппонент';
  }
}

export function coopOpponentHintBody(role: CoopRole): string {
  switch (role) {
    case 'developer':
      return 'ИИ давит на релиз: сильнее растёт угроза (THREAT), если вы медленно поставляете код. Цепочки на шине дают вам больше прогресса — собирайте синтаксис/функции подряд.';
    case 'qa':
      return 'ИИ чаще накидывает баги и «ICE» на шину. Ваши реакции и тест-карты снимают дефекты эффективнее; ловите outplay, чтобы вычистить сразу больше.';
    case 'admin':
      return 'Удары по периметру и стресс слегка смягчены: держите инфру, скрипты и карантин, пока команда гонит фичу.';
    case 'pm':
      return 'Фоновый шум и дедлайн давят на стресс чуть мягче: софт-процесс и буферы снимают давление с команды.';
    default:
      return 'Следите за NEXT_INTENT и типом проблемы для реакций.';
  }
}
