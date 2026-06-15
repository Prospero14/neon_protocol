/** Перемещение по карте Night City — время в пути. */

export type ZoneCenter = { zoneKey: string; x: number; y: number; w: number; h: number };

export function zoneCenter(z: ZoneCenter): { x: number; y: number } {
  return { x: z.x + z.w / 2, y: z.y + z.h / 2 };
}

export function zoneDistance(a: ZoneCenter, b: ZoneCenter): number {
  const ca = zoneCenter(a);
  const cb = zoneCenter(b);
  return Math.hypot(ca.x - cb.x, ca.y - cb.y);
}

/** Минуты игрового времени: пешком / на транспорте (speed 40–120). */
export function travelMinutes(
  from: ZoneCenter | null,
  to: ZoneCenter,
  opts: { vehicleSpeed?: number; onFoot?: boolean }
): number {
  if (!from || from.zoneKey === to.zoneKey) return 0;
  const dist = zoneDistance(from, to);
  if (opts.onFoot || !opts.vehicleSpeed) {
    return Math.max(5, Math.round(dist * 0.35));
  }
  const speedFactor = Math.max(40, opts.vehicleSpeed) / 80;
  return Math.max(2, Math.round((dist * 0.35) / speedFactor));
}

export function formatTravelMessage(opts: {
  displayName: string;
  fromLabel: string;
  toLabel: string;
  minutes: number;
  vehicleName?: string;
  overload?: boolean;
}): string {
  const mode = opts.vehicleName
    ? opts.overload
      ? `на «${opts.vehicleName}» (ПЕРЕГРУЗ мест)`
      : `на «${opts.vehicleName}»`
    : 'пешком';
  return `${opts.displayName}: ${opts.fromLabel} → ${opts.toLabel} · ${mode} · ~${opts.minutes} мин`;
}
