/**
 * Модель кооп-команды: один живой игрок + до трёх «союзников» (пати или боты).
 * Настоящий мультиплеер по сети — отдельная задача; здесь контракт и симуляция ботов.
 */

import type { CoopRole } from './sessionMode';
import { COOP_ROLES } from './sessionMode';

/** Как заполнены остальные три роли относительно вас. */
export type CoopSquadFill = 'synthetic_bots' | 'live_party';

export function isCoopSquadFill(v: unknown): v is CoopSquadFill {
  return v === 'synthetic_bots' || v === 'live_party';
}

/** Роли кроме игрока — для UI и симуляции. */
export function otherCoopRoles(playerRole: CoopRole): CoopRole[] {
  return COOP_ROLES.filter((r) => r !== playerRole);
}

export type SyntheticSquadTickResult = {
  logs: string[];
  bugDelta: number;
  stressDelta: number;
  mitigationDelta: number;
  progressDelta: number;
};

/**
 * Конец раунда ИИ → «союзники-боты» слегка двигают общие метрики (один клиент).
 * При live_party не вызывать (ходы других игроков придут по сети позже).
 */
export function rollSyntheticSquadAssist(params: {
  playerRole: CoopRole;
  bugSlotsOnRail: number;
  stress: number;
  infraFilledSlots: number;
  playerProgress: number;
}): SyntheticSquadTickResult | null {
  const allies = otherCoopRoles(params.playerRole);
  const logs: string[] = [];
  let bugDelta = 0;
  let stressDelta = 0;
  let mitigationDelta = 0;
  let progressDelta = 0;

  const shuffled = [...allies].sort(() => Math.random() - 0.5);
  const pick = shuffled.slice(0, 2);

  for (const role of pick) {
    const r = Math.random();
    if (role === 'qa') {
      if (params.bugSlotsOnRail > 0 && r < 0.38) {
        bugDelta -= 1;
        logs.push('[КОМАНДА:QA] Снят шум по дефекту на шине (−1 к баг-метрике).');
      } else if (params.playerRole === 'developer' && r < 0.22) {
        mitigationDelta += 2;
        logs.push('[КОМАНДА:QA] Лёгкий регресс-патч на периметре (+2 mitigation).');
      }
    } else if (role === 'admin') {
      if (params.infraFilledSlots < 8 && r < 0.32) {
        mitigationDelta += 2;
        stressDelta -= 1;
        logs.push('[КОМАНДА:ADMIN] Контур удержан: +2 mitigation, −1 стресс.');
      } else if (r < 0.2) {
        mitigationDelta += 1;
        logs.push('[КОМАНДА:ADMIN] Ротация сертов / LB (+1 mitigation).');
      }
    } else if (role === 'pm') {
      if (params.stress > 35 && r < 0.4) {
        stressDelta -= 4;
        logs.push('[КОМАНДА:PM] Буфер спринта / фокус (−4 стресс).');
      } else if (params.playerRole === 'developer' && r < 0.25) {
        progressDelta += 2;
        logs.push('[КОМАНДА:PM] Снят блокер по scope (+2% прогресс).');
      }
    } else if (role === 'developer') {
      if (params.playerRole !== 'developer' && params.playerProgress < 85 && r < 0.28) {
        progressDelta += 3;
        logs.push('[КОМАНДА:DEV] Параллельный коммит на общую шину (+3% прогресс).');
      }
    }
  }

  if (logs.length === 0) return null;
  return { logs, bugDelta, stressDelta, mitigationDelta, progressDelta };
}
