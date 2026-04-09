/**
 * Краткие брифинги под ТЗ: у игрока уже есть конкретные шаги в модалке —
 * здесь только тон и контекст сессии, без второго «простыня»-описания задачи.
 */

import type { BugEnemy } from './combatEnemies';
import type { SkillMode } from './skillMode';

export interface OpponentPipelineNarrative {
  headline: string;
  spectrum: string;
  body: string;
  encounter: string;
}

function encounterLine(enemy: BugEnemy | null | undefined): string {
  if (!enemy) {
    return 'Сессия: рандомный процесс на шине — давит таймером, пока ты возишься с консолью.';
  }
  const title = enemy.name;
  switch (enemy.visualType) {
    case 'DEVELOPER':
      return `«${title}» — чей-то сменный оператор или подряд: живой ответ, регламенты, зануда в первом слое.`;
    case 'ICE':
      return `«${title}» — фильтр/аудит: не спорит, просто вставляет статусы и жрёт окно, пока ты ковыряешь шину.`;
    case 'AI':
    default:
      return `«${title}» — автомат без лица: скрипт, бот, демон — суть одна, давит очередью и шумом.`;
  }
}

/** Режим скриптера: сухой ориентир, без манифеста — задача уже в ТЗ (ls / grep / cat …). */
function narrativeScriptKiddie(enemy: BugEnemy | null | undefined): OpponentPipelineNarrative {
  const visual = enemy?.visualType;
  let body =
    'Ты не «архитектор судьбы» — ты человек с терминалом в городе, где каждый второй продаёт доступ к чужому железу. ' +
    'Собери цепочку по ТЗ, пережди скан, выкати билд. Всё остальное — реклама.';
  if (visual === 'DEVELOPER') {
    body =
      'Живой контур: смена, согласования, кто-то реально жмёт «escalate». Тот же пайплайн, только с человеческим задерживающим фактором.';
  } else if (visual === 'ICE') {
    body =
      'Лёд не морализирует — он режет пакеты и подсовывает статусы. Обходишь скриптами и реакциями, пока не закроешь тикет.';
  }

  return {
    headline: 'СЕССИЯ: ЧУЖОЙ ПРОЦЕСС',
    spectrum: '',
    body,
    encounter: encounterLine(enemy),
  };
}

const CYBERPUNK_OPPONENT_SPECTRUM =
  'Оппонент — не обязательно «второй программист». Это давление на поставку: чужой ИИ, подряд, ICE, ночной дежурный — ' +
  'маска любая, механика одна: Threat, баги на шине, стресс.';

function narrativeDeveloper(enemy: BugEnemy | null | undefined): OpponentPipelineNarrative {
  const visual = enemy?.visualType;
  let flavor =
    'Под маской — CI, сканы, легаси: кто угодно с той стороны билда.';
  if (visual === 'DEVELOPER') {
    flavor = 'Контур людей: релиз-менеджер, дежурный, аутсорс — те же часы и эскалации.';
  } else if (visual === 'ICE') {
    flavor = 'Корпоративный периметр: политики, аудит, дыры после скана — закрываются тестами и патчами.';
  }

  return {
    headline: 'ОППОНЕНТ: СИСТЕМА И ОЧЕРЕДЬ',
    spectrum: CYBERPUNK_OPPONENT_SPECTRUM,
    body:
      'Полный цикл: ресурсы → код по контракту → стабилизация → выкладка. Threat и BUG_ERROR — цена дыр до релиза. ' +
      flavor,
    encounter: encounterLine(enemy),
  };
}

export function getOpponentPipelineNarrative(
  skillMode: SkillMode,
  enemy: BugEnemy | null | undefined
): OpponentPipelineNarrative {
  return skillMode === 'script-kiddie' ? narrativeScriptKiddie(enemy) : narrativeDeveloper(enemy);
}
