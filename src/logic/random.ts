export interface WeightedEntry<T> {
  value: T;
  weight: number;
}

export function weightedPick<T>(entries: WeightedEntry<T>[], rnd = Math.random): T {
  const total = entries.reduce((acc, e) => acc + Math.max(0, e.weight), 0);
  if (total <= 0) return entries[0].value;
  let roll = rnd() * total;
  for (const e of entries) {
    roll -= Math.max(0, e.weight);
    if (roll <= 0) return e.value;
  }
  return entries[entries.length - 1].value;
}

export function randomInt(min: number, max: number, rnd = Math.random): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}
