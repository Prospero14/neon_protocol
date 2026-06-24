/** Валидация узлов сценария (квест / ветка) — общая для client/server. */

import { emptyScenarioLinks, parseScenarioLinks, type NriScenarioLinks } from './scenarioLinks.js';

export const SCENARIO_TITLE_MAX = 120;
export const SCENARIO_SUMMARY_MAX = 600;
export const SCENARIO_BODY_MAX = 20000;

/** Стабильные коды ошибок валидации сценария (совпадают с sendApiError). */
export const SCENARIO_ERROR = {
  TITLE_REQUIRED: 'NRI_SCENARIO_TITLE_REQUIRED',
  TITLE_STRING: 'NRI_SCENARIO_TITLE_STRING',
  SUMMARY_STRING: 'NRI_SCENARIO_SUMMARY_STRING',
  BODY_STRING: 'NRI_SCENARIO_BODY_STRING',
  LINKS_OBJECT: 'NRI_SCENARIO_LINKS_OBJECT',
  SORT_NUMBER: 'NRI_SCENARIO_SORT_NUMBER',
  PARENT_STRING: 'NRI_SCENARIO_PARENT_STRING',
} as const;

export type ScenarioValidationResult =
  | { ok: true; data: Partial<NormalizedScenarioNode> }
  | { ok: false; code: string; message: string };

export type ScenarioNodeInput = {
  parentId?: string | null;
  title?: unknown;
  summary?: unknown;
  body?: unknown;
  links?: unknown;
  sortOrder?: unknown;
};

export type NormalizedScenarioNode = {
  parentId: string | null;
  title: string;
  summary: string;
  body: string;
  links: NriScenarioLinks;
  sortOrder: number;
};

function asStringArray(raw: unknown, maxItems = 64, maxLen = 64): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== 'string') continue;
    const t = x.trim();
    if (!t) continue;
    out.push(t.slice(0, maxLen));
    if (out.length >= maxItems) break;
  }
  return out;
}

/** Нормализует links из API — отбрасывает лишние поля, проверяет массивы id. */
export function normalizeScenarioLinks(raw: unknown): NriScenarioLinks {
  const base = parseScenarioLinks(raw);
  return {
    ...base,
    npcIds: asStringArray(base.npcIds),
    catalogIds: asStringArray(base.catalogIds),
    fileIds: asStringArray(base.fileIds),
    placeTitle:
      typeof base.placeTitle === 'string' ? base.placeTitle.trim().slice(0, 120) : undefined,
    zoneKey: typeof base.zoneKey === 'string' && base.zoneKey.trim() ? base.zoneKey.trim().slice(0, 64) : null,
    mapMarkerId:
      typeof base.mapMarkerId === 'string' && base.mapMarkerId.trim()
        ? base.mapMarkerId.trim().slice(0, 64)
        : null,
    lorePlaceId:
      typeof base.lorePlaceId === 'string' && base.lorePlaceId.trim()
        ? base.lorePlaceId.trim().slice(0, 64)
        : null,
  };
}

export function normalizeScenarioNodeInput(
  input: ScenarioNodeInput,
  partial = false
): ScenarioValidationResult {
  const out: Partial<NormalizedScenarioNode> = {};

  const fail = (code: string, message: string): ScenarioValidationResult => ({ ok: false, code, message });

  if (input.parentId !== undefined) {
    if (input.parentId === null) out.parentId = null;
    else if (typeof input.parentId === 'string' && input.parentId.trim()) {
      out.parentId = input.parentId.trim();
    } else if (!partial) {
      return fail(SCENARIO_ERROR.PARENT_STRING, 'parentId должен быть строкой или null.');
    }
  }

  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      return fail(SCENARIO_ERROR.TITLE_STRING, 'Поле title должно быть строкой.');
    }
    if (!input.title.trim()) {
      return fail(SCENARIO_ERROR.TITLE_REQUIRED, 'Укажите название узла.');
    }
    out.title = input.title.trim().slice(0, SCENARIO_TITLE_MAX);
  } else if (!partial) {
    return fail(SCENARIO_ERROR.TITLE_REQUIRED, 'Укажите название узла.');
  }

  if (input.summary !== undefined) {
    if (input.summary !== null && typeof input.summary !== 'string') {
      return fail(SCENARIO_ERROR.SUMMARY_STRING, 'Краткая сводка (summary) должна быть строкой.');
    }
    out.summary = typeof input.summary === 'string' ? input.summary.slice(0, SCENARIO_SUMMARY_MAX) : '';
  }

  if (input.body !== undefined) {
    if (typeof input.body !== 'string') {
      return fail(SCENARIO_ERROR.BODY_STRING, 'Полный текст (body) должен быть строкой.');
    }
    out.body = input.body.slice(0, SCENARIO_BODY_MAX);
  }

  if (input.links !== undefined) {
    if (input.links !== null && typeof input.links !== 'object') {
      return fail(SCENARIO_ERROR.LINKS_OBJECT, 'Привязки (links) должны быть объектом.');
    }
    out.links = normalizeScenarioLinks(input.links ?? emptyScenarioLinks());
  }

  if (input.sortOrder !== undefined) {
    if (typeof input.sortOrder !== 'number' || !Number.isFinite(input.sortOrder)) {
      return fail(SCENARIO_ERROR.SORT_NUMBER, 'sortOrder должен быть конечным числом.');
    }
    out.sortOrder = Math.floor(input.sortOrder);
  }

  return { ok: true, data: out };
}
