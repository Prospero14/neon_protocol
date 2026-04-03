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
    id: 'q_professor_garbage',
    title: '[АКАДЕМИЯ] Сборка мусора',
    description: 'В Мейнфрейме Университета скопилось слишком много "битых ссылок". Профессор просит провести ручную дефрагментацию и очистку памяти.',
    districtId: 'south_west',
    giverNpcId: 'npc_professor',
    objectiveNodeId: 'combat_academic_guard',
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: false,
  },
  {
    id: 'q_trace_stress_test',
    title: '[QUAD] Стресс-тест сети',
    description: 'Таня (QA) из Марьино требует провести принудительный прозвон (ping) локальных узлов. Пакеты теряются, и нужно выяснить, где именно происходит затык.',
    districtId: 'maryino',
    giverNpcId: 'npc_tanya',
    objectiveNodeId: 'combat_local_lan',
    type: 'combat',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_rat_data_dump',
    title: '[VOID] Нелегальный дамп',
    description: 'Крыса-курьер хочет, чтобы вы отбили серверную ферму в "Buffer Overflow Zone". Там спрятаны ценные данные Анархистов.',
    districtId: 'maryino',
    giverNpcId: 'npc_rat',
    objectiveNodeId: 'combat_overflow',
    type: 'combat',
    difficulty: 'hard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_besm_vintage_code',
    title: '[RPG] Винтажный код',
    description: 'Генерал БЭСМ ищет драйверы для своей архитектуры 1974 года. Попробуйте найти их у Скупщика на рынке в Измайлово.',
    districtId: 'vdnkh',
    giverNpcId: 'npc_besm',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_monya_signal_echo',
    title: '[RPG] Эхо сигнала',
    description: 'Связист Моня из Бибирево жалуется на помехи. Гид в ВДНХ может знать о старых зонах радиомолчания в этом районе.',
    districtId: 'bibirevo',
    giverNpcId: 'npc_signalman',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_verstak_cooling',
    title: '[DELIVERY] Хладагент для Верстака',
    description: 'Мастеру Верстаку из Измайлово нужен технический хладагент. Его можно достать у Крысы-курьера в Марьино.',
    districtId: 'izmailovo',
    giverNpcId: 'npc_master',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_niksanna_recommendation',
    title: '[TALK] Рекомендация в Академию',
    description: 'Никсанна хочет, чтобы вы пошли в Академию. Обратитесь к Профессору Архипову в Юго-Западном секторе с её "визуальным образцом".',
    districtId: 'altufyevo',
    giverNpcId: 'npc_niksanna',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_weaver_pattern',
    title: '[DELIVERY] Паттерн Ткача',
    description: 'Старшему Ткачу из Текстильщиков нужен старый промышленный паттерн. Он должен быть в архивах Академии на Юго-Западе.',
    districtId: 'tekstilschiki',
    giverNpcId: 'npc_weaver_senior',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: false,
  },
  {
    id: 'q_vykhino_delivery',
    title: '[DELIVERY] Тяжелый блок данных',
    description: 'Грузчик из Выхино просит доставить габаритный блок данных Петровичу в Алтуфьево. Будьте осторожны, он фонит.',
    districtId: 'vykhino',
    giverNpcId: 'npc_vykhino_loader',
    type: 'delivery',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: false,
  },
  {
    id: 'q_chertanovo_privacy',
    title: '[TALK] Протокол приватности',
    description: 'Параноидальному жителю Чертаново нужен "Privacy Patch". Никсанна из Алтуфьево — единственный мастер, кто может его собрать.',
    districtId: 'chertanovo',
    giverNpcId: 'npc_chertanovo_paranoid',
    type: 'talk',
    difficulty: 'standard',
    tier: 1,
    preClassOnly: true,
  },
  {
    id: 'q_bibirevo_energy',
    title: '[TALK] Энергия для кодера',
    description: 'Сонный кодер из Бибирево засыпает на посту. Ему нужен "Дзен-Лог" от Мастера Олега с ВДНХ.',
    districtId: 'bibirevo',
    giverNpcId: 'npc_bibirevo_coder',
    type: 'talk',
    difficulty: 'quick',
    tier: 1,
    preClassOnly: true,
  },
];

export const QUEST_LIBRARY: QuestDefinition[] = [
  ...TUTORIAL_QUESTS,
  ...buildNpcQuests(), 
  ...buildCombatDistrictQuests()
];
