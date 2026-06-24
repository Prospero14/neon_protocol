import { describe, it, expect } from 'vitest';
import {
  normalizeScenarioNodeInput,
  normalizeScenarioLinks,
  SCENARIO_BODY_MAX,
  SCENARIO_ERROR,
  SCENARIO_SUMMARY_MAX,
} from './scenarioSchema.js';
import { buildLoreCardIndex } from './loreCards.js';

describe('scenarioSchema', () => {
  it('rejects create without title', () => {
    const r = normalizeScenarioNodeInput({ body: 'x' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe(SCENARIO_ERROR.TITLE_REQUIRED);
    expect(r.message).toMatch(/название/i);
  });

  it('rejects invalid links type with code', () => {
    const r = normalizeScenarioNodeInput({ title: 'Квест', links: 'bad' }, true);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe(SCENARIO_ERROR.LINKS_OBJECT);
  });

  it('normalizes links id arrays and truncates strings', () => {
    const links = normalizeScenarioLinks({
      npcIds: [' npc-1 ', 42, 'npc-2'],
      catalogIds: ['item_a'],
      fileIds: [],
      zoneKey: ' zone_downtown ',
      meetCheckpoint: true,
    });
    expect(links.npcIds).toEqual(['npc-1', 'npc-2']);
    expect(links.zoneKey).toBe('zone_downtown');
    expect(links.meetCheckpoint).toBe(true);
  });

  it('truncates summary and body to limits', () => {
    const r = normalizeScenarioNodeInput({
      title: 'T',
      summary: 's'.repeat(SCENARIO_SUMMARY_MAX + 50),
      body: 'b'.repeat(SCENARIO_BODY_MAX + 50),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.summary!.length).toBe(SCENARIO_SUMMARY_MAX);
    expect(r.data.body!.length).toBe(SCENARIO_BODY_MAX);
  });
});

describe('loreCards scenario index', () => {
  it('uses summary for scenario cards, not full body', () => {
    const cards = buildLoreCardIndex({
      scenarios: [{ id: 'q1', title: 'Новый квест', summary: 'Кратко', body: 'Очень длинный мастерский текст' }],
    });
    expect(cards).toHaveLength(1);
    expect(cards[0]?.kind).toBe('scenario');
    expect(cards[0]?.summary).toBe('Кратко');
  });
});
