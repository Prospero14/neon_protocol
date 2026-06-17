/** Что уже заполнено на листе vs что остаётся мастеру/игроку. */

import { getC2185ClassTemplate } from './nriCarbon2185';
import type { NriClassId } from './nriClasses';
import { parseNriSheet } from './nriNpcGenerator';

export type SheetFieldStatus = { id: string; label: string; done: boolean };

export function getSheetFieldStatuses(sheetRaw: unknown, classId: NriClassId): SheetFieldStatus[] {
  const sheet = parseNriSheet(sheetRaw);
  const tpl = getC2185ClassTemplate(classId);
  const has = (v?: string | null) => Boolean(v && String(v).trim());

  return [
    { id: 'abilities', label: 'Характеристики', done: !!sheet?.abilities?.STR },
    { id: 'class', label: `Класс ${tpl?.carbonName ?? classId}`, done: !!tpl },
    { id: 'skills', label: 'Навыки (владение)', done: (sheet?.skillProficiencies?.length ?? 0) >= 2 },
    { id: 'features', label: 'Черты класса', done: (sheet?.classFeatures?.length ?? 0) > 0 },
    { id: 'attacks', label: 'Атаки', done: (sheet?.attacks?.length ?? 0) > 0 },
    { id: 'bio', label: 'Происхождение / био', done: has(sheet?.origin) && has(sheet?.age) },
    { id: 'backstory', label: 'Бэкстори', done: has(sheet?.backstory) },
    { id: 'clothing', label: 'Одежда', done: has(sheet?.clothing) },
    { id: 'vice', label: 'Vice', done: has(sheet?.vice) },
    { id: 'augmentations', label: 'Импланты', done: (sheet?.augmentations?.length ?? 0) > 0 },
    { id: 'equipment', label: 'Снаряжение', done: false },
    { id: 'notes', label: 'Заметки мастера', done: has(sheet?.notes) },
  ];
}

export function sheetAutoFillSummary(sheetRaw: unknown, classId: NriClassId): string {
  const rows = getSheetFieldStatuses(sheetRaw, classId);
  const done = rows.filter((r) => r.done && r.id !== 'equipment').map((r) => r.label);
  const pending = rows.filter((r) => !r.done).map((r) => r.label);
  if (pending.length === 0) return `Автозаполнено: ${done.join(', ')}.`;
  return `Готово: ${done.join(', ') || '—'}. На столе: ${pending.join(', ')}.`;
}
