/**
 * Подача ТЗ в UI для кооп-ролей ≠ developer: та же цепочка шагов и карты на шине,
 * но текст описывает вклад QA / SRE / PM в общую задачу с девелопером.
 */

import type { TechnicalTask, TZStep } from './combatTasks';
import type { CoopRole, SessionMode } from './sessionMode';
import { COOP_ROLE_LABELS } from './sessionMode';

function mirrorStepName(role: CoopRole, devStep: TZStep, index: number): string {
  const dev = devStep.name;
  if (role === 'qa') {
    return `QA · шаг ${index + 1}: приёмка и регресс вокруг «${dev}»`;
  }
  if (role === 'admin') {
    return `SRE · шаг ${index + 1}: контур поставки для «${dev}»`;
  }
  if (role === 'pm') {
    return `PM · шаг ${index + 1}: рамка инкремента / риски для «${dev}»`;
  }
  return devStep.name;
}

function roleDescription(role: CoopRole, mission: TechnicalTask): string {
  /** Не дублируем полный текст DEV-ТЗ — у разработчика свой экран; здесь только рамка роли. */
  const anchor = `Спринт синхронизирован с задачей «${mission.name}».`;
  if (role === 'qa') {
    return (
      `${anchor} Ваша зона — стабилизация и снятие дефектов; пошаговый гайд по конструкциям на шине не показываем — это контур DEVELOPER.`
    );
  }
  if (role === 'admin') {
    return (
      `${anchor} Ваша зона — снабжение INFRA и ресурсы; подробный DEV-чеклист по шине не отображается.`
    );
  }
  if (role === 'pm') {
    return (
      `${anchor} Ваша зона — процесс и SOFT; детальный список шагов кода — только у разработчика.`
    );
  }
  return mission.description;
}

/**
 * @returns Копию миссии с теми же `steps` (id, requiredCardIds), но с ролевым заголовком и подписями шагов для UI.
 */
export function coopParallelTzForRole(
  mission: TechnicalTask,
  sessionMode: SessionMode,
  coopRole: CoopRole | null
): TechnicalTask {
  if (sessionMode !== 'coop' || !coopRole || coopRole === 'developer') return mission;

  const roleTitle = COOP_ROLE_LABELS[coopRole].title;
  return {
    ...mission,
    name: `${roleTitle} · ${mission.name}`,
    description: roleDescription(coopRole, mission),
    steps: mission.steps.map((step, i) => ({
      ...step,
      name: mirrorStepName(coopRole, step, i),
    })),
  };
}
