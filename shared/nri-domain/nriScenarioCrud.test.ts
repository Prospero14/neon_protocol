import { describe, it, expect } from 'vitest';
import { normalizeScenarioNodeInput, normalizeScenarioLinks } from './scenarioSchema.js';
import { buildLoreCardIndex } from './loreCards.js';

/** Позитивный сценарий без SQLite — типы, links, индекс карточек. */
describe('scenario quest positive flow (unit)', () => {
  it('create → fill summary/body/links → card index → delete payload shape', () => {
    const root = normalizeScenarioNodeInput({ title: 'Основной сценарий' });
    expect(root.ok).toBe(true);

    const links = normalizeScenarioLinks({
      npcIds: ['npc-1'],
      catalogIds: ['item_medkit'],
      fileIds: ['vault-file-1'],
      zoneKey: 'downtown_watson',
      meetCheckpoint: false,
    });

    const quest = normalizeScenarioNodeInput({
      parentId: 'root-id',
      title: 'Новый квест',
      summary: 'Погодная колонка солгала — промокла насквозь.',
      body: 'Полный текст для мастера: детали сцены, ветки, секреты.',
      links,
    });
    expect(quest.ok).toBe(true);
    if (!quest.ok) return;

    expect(quest.data.title).toBe('Новый квест');
    expect(quest.data.summary).toContain('Погодная колонка');
    expect(quest.data.body).toContain('Полный текст');
    expect(quest.data.links?.npcIds).toEqual(['npc-1']);
    expect(quest.data.links?.zoneKey).toBe('downtown_watson');

    const cards = buildLoreCardIndex({
      scenarios: [
        {
          id: 'quest-1',
          title: quest.data.title!,
          summary: quest.data.summary!,
          body: quest.data.body!,
        },
      ],
    });
    expect(cards[0]?.summary).toBe(quest.data.summary);
    expect(cards[0]?.summary).not.toContain('Полный текст');

    const patch = normalizeScenarioNodeInput(
      { title: 'Новый квест', summary: '', body: '', links: {} },
      true
    );
    expect(patch.ok).toBe(true);
  });

  it('rejects invalid partial patch types', () => {
    expect(normalizeScenarioNodeInput({ body: 123 as unknown as string }, true).ok).toBe(false);
    expect(normalizeScenarioNodeInput({ summary: 42 as unknown as string }, true).ok).toBe(false);
  });
});
