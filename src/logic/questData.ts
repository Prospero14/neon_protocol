import { MAP_NODES } from './mapData';

export type QuestType = 'talk' | 'combat' | 'delivery' | 'diagnostics';
export type QuestDifficulty = 'quick' | 'standard' | 'hard';

export interface QuestDefinition {
  id: string;
  title: string;
  districtId: string;
  giverNpcId: string;
  description: string;
  objectiveNodeId?: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  tier: number;
  preClassOnly?: boolean;
}

const NPC_QUEST_BLUEPRINTS = [
  {
    suffix: 'signal_sweep',
    title: 'Прочес сети',
    type: 'diagnostics' as const,
    difficulty: 'quick' as const,
    text: 'Сними показания с узлов и верни короткий отчёт.',
  },
  {
    suffix: 'local_contract',
    title: 'Локальный контракт',
    type: 'talk' as const,
    difficulty: 'standard' as const,
    text: 'Собери требования заказчика и закрой тикет без эскалации.',
  },
];

const COMBAT_QUEST_BLUEPRINTS = [
  {
    suffix: 'bug_sweep',
    title: 'Зачистка бага',
    type: 'combat' as const,
    difficulty: 'standard' as const,
    text: 'Подави нестабильный узел в районе и стабилизируй сервис.',
  },
  {
    suffix: 'secure_delivery',
    title: 'Безопасная доставка',
    type: 'delivery' as const,
    difficulty: 'hard' as const,
    text: 'Доставь пакет через враждебный сегмент без потери данных.',
  },
];

function buildNpcQuests() {
  const quests: QuestDefinition[] = [];
  for (const district of MAP_NODES) {
    const npcs = district.subNodes?.filter((s) => s.type === 'npc') ?? [];
    for (const npc of npcs) {
      NPC_QUEST_BLUEPRINTS.forEach((b, idx) => {
        quests.push({
          id: `q_${district.id}_${npc.id}_${b.suffix}`,
          title: `${b.title}: ${npc.name}`,
          districtId: district.id,
          giverNpcId: npc.id,
          description: b.text,
          type: b.type,
          difficulty: b.difficulty,
          tier: district.tier,
          preClassOnly: idx === 0,
        });
      });
    }
  }
  return quests;
}

function buildCombatDistrictQuests() {
  const quests: QuestDefinition[] = [];
  for (const district of MAP_NODES) {
    const combats = district.subNodes?.filter((s) => s.type === 'combat') ?? [];
    for (const node of combats) {
      COMBAT_QUEST_BLUEPRINTS.forEach((b, idx) => {
        quests.push({
          id: `q_${district.id}_${node.id}_${b.suffix}`,
          title: `${b.title}: ${node.name}`,
          districtId: district.id,
          giverNpcId: (district.subNodes?.find((s) => s.type === 'npc')?.id ?? node.id),
          objectiveNodeId: node.id,
          description: b.text,
          type: b.type,
          difficulty: b.difficulty,
          tier: district.tier,
          preClassOnly: idx === 0,
        });
      });
    }
  }
  return quests;
}

export const QUEST_LIBRARY: QuestDefinition[] = [...buildNpcQuests(), ...buildCombatDistrictQuests()];
