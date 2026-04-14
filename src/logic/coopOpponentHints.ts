/**
 * Кратко: что делает ИИ против каждой роли в коопе (один оппонент, разные акценты модификаторов).
 */
import type { CoopRole } from './sessionMode';

/** Общее для коопа: параллельные стадии и общая шина. */
const SDLC_PARALLEL_NOTE =
  ' Все этапы SDLC идут параллельно: ваши ходы сразу отражаются на общей шине и метриках команды.';

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
      return (
        'ИИ давит на релиз: сильнее растёт угроза (THREAT), если вы медленно поставляете код. Цепочки на шине дают вам больше прогресса — собирайте синтаксис/функции подряд.' +
        SDLC_PARALLEL_NOTE
      );
    case 'qa':
      return (
        'ИИ чаще накидывает баги и «ICE» на шину. Ваши реакции и тест-карты снимают дефекты эффективнее; ловите outplay, чтобы вычистить сразу больше.' +
        SDLC_PARALLEL_NOTE
      );
    case 'admin':
      return (
        'Удары по периметру и стресс слегка смягчены: держите инфру, скрипты и карантин, пока команда гонит фичу.' +
        SDLC_PARALLEL_NOTE
      );
    case 'pm':
      return (
        'Фоновый шум и дедлайн давят на стресс чуть мягче: софт-процесс и буферы снимают давление с команды.' +
        SDLC_PARALLEL_NOTE
      );
    default:
      return 'Следите за NEXT_INTENT и типом проблемы для реакций.' + SDLC_PARALLEL_NOTE;
  }
}
