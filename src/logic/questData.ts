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
          title: `[${b.type.toUpperCase().slice(0, 4)}] ${b.title}: ${npc.name}`,
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
          title: `[${b.type.toUpperCase().slice(0, 4)}] ${b.title}: ${node.name}`,
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

const TUTORIAL_QUESTS: QuestDefinition[] = [
  {
    id: 'q_kiddo_start',
    title: '[ВВОД] Пробуждение в Altufyevo',
    description: 'Система инициализирована. Твоя дека пуста, а в карманах только эхо. Поговори с Петровичем, он присматривает за новичками в этом секторе.',
    districtId: 'altufyevo',
    giverNpcId: 'npc_petrovich',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_kiddo_first_bits',
    title: '[ВВОД] Первые Bits',
    description: 'Петрович не работает бесплатно. Найди Доску Объявлений в Алтуфьево и заверши простейший контракт на чистку кэша.',
    districtId: 'altufyevo',
    giverNpcId: 'job_board_alt',
    objectiveNodeId: 'job_board_alt',
    type: 'combat',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_kiddo_metro_access',
    title: '[ВВОД] Путь в Центр',
    description: 'Чтобы покинуть окраины, тебе нужен доступ к Такси. Собери 100 Bits и разблокируй терминал в Алтуфьево.',
    districtId: 'altufyevo',
    giverNpcId: 'term_taxi_alt',
    objectiveNodeId: 'term_taxi_alt',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_trainee_exam_theory',
    title: '[ЭКЗАМЕН] Теория Архитектуры',
    description: 'Найди Профессора Архипова на Юго-Западной. Он проверит твои знания основ перед тем, как допустить к Боевому Экзамену.',
    districtId: 'south_west',
    giverNpcId: 'npc_professor',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_trainee_exam_practice',
    title: '[ЭКЗАМЕН] Боевой Диплом',
    description: 'Финальный этап. Докажи Профессору, что ты можешь не только рассуждать о Java, но и дебажить реальность. Победи тренировочного бота на ВДНХ.',
    districtId: 'vdnkh',
    giverNpcId: 'npc_besm',
    objectiveNodeId: 'combat_pavilions',
    type: 'combat',
    difficulty: 'hard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_maryino_passage',
    title: '[RPG] Переправа: Марьино',
    description: 'Для свободного прохода через южные узлы нужно договориться с группировкой "Восход". Начни с Крысы-курьера, он знает, кто здесь держит улицу.',
    districtId: 'maryino',
    giverNpcId: 'npc_rat',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_neon_academy_bootcamp',
    title: '[КУРСЫ] Основы Био-Архитектуры',
    description: 'Ты оплатил обучение. Теперь пора понять, как не сжечь свои мозги при первом же контакте с Багом. Найди Профессора Архипова для вводного инструктажа.',
    districtId: 'south_west',
    giverNpcId: 'npc_professor',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: false,
  }
];

export const QUEST_LIBRARY: QuestDefinition[] = [
  ...TUTORIAL_QUESTS,
  ...buildNpcQuests(), 
  ...buildCombatDistrictQuests()
];
