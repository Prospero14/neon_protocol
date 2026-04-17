/**
 * Интегральные проверки коопа и полигона (логика, данные, отсутствие «дыр» в покрытии).
 *
 * Сверка роли админа с реальным миром (SRE / инфра): планирование ёмкости, балансировка,
 * отказоустойчивость, безопасность контура, наблюдаемость — см. обзоры:
 * - https://www.splunk.com/en_us/data-insider/what-is-site-reliability-engineering.html
 * - https://handbook.gitlab.com/job-families/engineering/infrastructure/site-reliability-engineer
 *
 * В коде админ закрывает INFRA/SCRIPT в колоде и поднимает RAM/CPU через карты — это
 * соответствует «железу и периметру»; синтетический контур в бою дополняет RAM, если
 * на клиенте нет отдельной фазы снабжения (см. useCombatLogic).
 */

import { describe, expect, it } from 'vitest';
import { TZ_LIBRARY, getStepCardIds, type TechnicalTask } from './combatTasks';
import { getCardById } from './combatCards';
import { isOutplayCounter } from './combatCounterplay';
import type { BugProblemType } from './combatEnemies';
import { validateCoopMissionCardCoverage } from './coopMissionCoverage';
import { buildCoopSprintReport, scorePlayerRole, type CoopSprintMetrics } from './coopSprint';
import {
  buildCoopProtocolDocCards,
  buildStarterDeckForSession,
  COOP_DECK_MAX_CARDS,
  COOP_DECK_MIN_CARDS,
  getCoopRoleCatalogIds,
  type CoopRole,
} from './sessionMode';
import { nextCoopTierRank } from './coopYardRuntime';

const JAVA_STACK = 'java' as const;

function yardTasksByRank(rank: TechnicalTask['rank']): TechnicalTask[] {
  return TZ_LIBRARY.filter((t) => t.districtId === 'coop_yard' && t.rank === rank && !t.id.includes('_boss_'));
}

/** Сколько вариантов шага резолвятся в CARD_LIBRARY (контент реально в билде). */
function countResolvableStepIds(step: TechnicalTask['steps'][number]): number {
  return getStepCardIds(step).filter((id) => getCardById(id)).length;
}

describe('coopHolistic — полигон и роли', () => {
  it('validateCoopMissionCardCoverage остаётся пустым после правок миссий', () => {
    expect(validateCoopMissionCardCoverage(TZ_LIBRARY)).toEqual([]);
  });

  it('джун-полигон: первые 10 intro-миссий — у каждого шага ≥2 карт из java-каталога (вариативность)', () => {
    for (let i = 1; i <= 10; i++) {
      const id = `coop_yard_ju_${String(i).padStart(3, '0')}`;
      const task = TZ_LIBRARY.find((t) => t.id === id);
      expect(task, id).toBeDefined();
      for (const step of task!.steps) {
        const n = countResolvableStepIds(step);
        expect(n, `${id} step ${step.id}`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it(`кооп: стартовая колода developer java — [${COOP_DECK_MIN_CARDS}…${COOP_DECK_MAX_CARDS}], все резолвятся`, () => {
    const deck = buildStarterDeckForSession('coop', 'developer', JAVA_STACK);
    expect(deck.length).toBeGreaterThanOrEqual(COOP_DECK_MIN_CARDS);
    expect(deck.length).toBeLessThanOrEqual(COOP_DECK_MAX_CARDS);
    expect(deck.every((c) => c && c.id)).toBe(true);
  });

  it.each(['qa', 'pm', 'admin'] as const)(`стартовая колода %s — в пределах [${COOP_DECK_MIN_CARDS}…${COOP_DECK_MAX_CARDS}]`, (role) => {
    const deck = buildStarterDeckForSession('coop', role, null);
    expect(deck.length).toBeGreaterThanOrEqual(COOP_DECK_MIN_CARDS);
    expect(deck.length).toBeLessThanOrEqual(COOP_DECK_MAX_CARDS);
    expect(deck.every((c) => c && c.id)).toBe(true);
  });

  it('buildCoopProtocolDocCards: каждая карта дока входит в каталог роли', () => {
    const roles: CoopRole[] = ['developer', 'qa', 'admin', 'pm'];
    for (const role of roles) {
      const stack = role === 'developer' ? JAVA_STACK : null;
      const cat = getCoopRoleCatalogIds(role, stack);
      const doc = buildCoopProtocolDocCards(role, stack);
      expect(doc.length).toBeGreaterThan(0);
      expect(doc.every((c) => cat.has(c.id))).toBe(true);
    }
  });

  it('QA: strong outplay по основным тех-типам багов (реакции/защита в каталоге)', () => {
    const cat = getCoopRoleCatalogIds('qa', null);
    /** BUSINESS_RISK в коде бьётся в основном SOFT PM; у QA остаётся слабый патч + метрики спринта. */
    const types: BugProblemType[] = ['FATIGUE', 'TECH_DEBT', 'SYNTAX_ERROR', 'LOGIC_GAP', 'MEMORY_LEAK'];
    for (const pt of types) {
      const hit = [...cat].some((id) => {
        const card = getCardById(id);
        return card && (card.type === 'REACTION' || card.type === 'DEFENSIVE') && isOutplayCounter(card, pt);
      });
      expect(hit, `QA strong counter for ${pt}`).toBe(true);
    }
  });

  it('QA старт: достаточно реакций/защиты для стабилизации', () => {
    const deck = buildStarterDeckForSession('coop', 'qa', null);
    const react = deck.filter((c) => c.type === 'REACTION').length;
    const def = deck.filter((c) => c.type === 'DEFENSIVE').length;
    expect(react + def).toBeGreaterThanOrEqual(6);
  });

  it('PM старт: достаточно SOFT для поддержки команды', () => {
    const deck = buildStarterDeckForSession('coop', 'pm', null);
    expect(deck.filter((c) => c.type === 'SOFT').length).toBeGreaterThanOrEqual(8);
  });

  it('Admin старт: INFRA + SCRIPT (периметр и «железо»)', () => {
    const deck = buildStarterDeckForSession('coop', 'admin', null);
    const infra = deck.filter((c) => c.type === 'INFRASTRUCTURE').length;
    const script = deck.filter((c) => c.type === 'SCRIPT').length;
    expect(infra).toBeGreaterThanOrEqual(3);
    expect(script).toBeGreaterThanOrEqual(4);
  });

  it('усложнение полигона: длина цепочки non-boss по рангам не убывает (ск → se)', () => {
    const len = (rank: TechnicalTask['rank']) => {
      const xs = yardTasksByRank(rank);
      expect(xs.length).toBeGreaterThan(0);
      return Math.min(...xs.map((t) => t.steps.length));
    };
    const lSk = len('script-kiddie');
    const lJu = len('junior');
    const lMi = len('mid');
    const lSe = len('senior');
    expect(lJu).toBeGreaterThanOrEqual(lSk);
    expect(lMi).toBeGreaterThanOrEqual(lJu);
    expect(lSe).toBeGreaterThanOrEqual(lMi);
  });

  it('прогресс тира полигона: после босса — следующий ранг', () => {
    expect(nextCoopTierRank('junior')).toBe('mid');
    expect(nextCoopTierRank('mid')).toBe('senior');
    expect(nextCoopTierRank('senior')).toBe(null);
  });

  it('финальный отчёт спринта: победа + deploymentOk повышает оценку vs провал', () => {
    const base: CoopSprintMetrics = {
      won: false,
      stressEnd: 60,
      bugPointsEnd: 4,
      playerProgressEnd: 40,
      aiProgressEnd: 70,
      aiDeadlineEnd: 2,
      chainLength: 3,
      deploymentOk: false,
    };
    const good: CoopSprintMetrics = {
      ...base,
      won: true,
      stressEnd: 25,
      bugPointsEnd: 0,
      playerProgressEnd: 100,
      aiProgressEnd: 20,
      aiDeadlineEnd: 5,
      chainLength: 10,
      deploymentOk: true,
    };
    const roles: CoopRole[] = ['developer', 'qa', 'admin', 'pm'];
    for (const role of roles) {
      expect(scorePlayerRole(role, good)).toBeGreaterThanOrEqual(scorePlayerRole(role, base));
      const rpt = buildCoopSprintReport(role, JAVA_STACK, good);
      expect(rpt.overall).toBeGreaterThanOrEqual(0);
      expect(rpt.overall).toBeLessThanOrEqual(100);
      expect(rpt.playerCriteria.length).toBeGreaterThan(0);
      expect(rpt.squad.length).toBe(4);
    }
  });
});

describe('coopHolistic — CoopTeamSitrep метрики (контракт UI)', () => {
  it('критерии PM присутствуют для «графиков»/панели отчёта', async () => {
    const { COOP_CRITERIA_LABELS } = await import('./coopSprint');
    expect(COOP_CRITERIA_LABELS.pm.length).toBeGreaterThanOrEqual(3);
    expect(COOP_CRITERIA_LABELS.pm.every((c) => c.label && c.weight > 0)).toBe(true);
  });
});
