/** Броски кубов для мастера NRI. */

export type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export const DICE_SIDES_OPTIONS: { value: DieSides; label: string }[] = [
  { value: 4, label: 'd4' },
  { value: 6, label: 'd6' },
  { value: 8, label: 'd8' },
  { value: 10, label: 'd10' },
  { value: 12, label: 'd12' },
  { value: 20, label: 'd20' },
  { value: 100, label: 'd100' },
];

export type DiceRollResult = {
  count: number;
  sides: DieSides;
  rolls: number[];
  total: number;
  modifier: number;
};

export function rollDice(count: number, sides: DieSides, modifier = 0, rng = Math.random): DiceRollResult {
  const n = Math.max(1, Math.min(20, Math.floor(count)));
  const rolls: number[] = [];
  for (let i = 0; i < n; i++) {
    rolls.push(1 + Math.floor(rng() * sides));
  }
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return { count: n, sides, rolls, total, modifier };
}

export function formatDiceRollMessage(result: DiceRollResult, who = 'Мастер'): string {
  const modStr =
    result.modifier === 0 ? '' : result.modifier > 0 ? `+${result.modifier}` : `${result.modifier}`;
  const formula = `${result.count}d${result.sides}${modStr}`;
  const detail =
    result.modifier === 0
      ? result.rolls.join(' + ')
      : `${result.rolls.join(' + ')} ${modStr}`;
  return `🎲 ${who}: ${formula} → [${detail}] = ${result.total}`;
}
