import { DialogueBuilder } from './dialogueUtils';
import type { DialogueTree } from './dialogues';
import { defaultAwayVisitNodeIdForDistrict } from './mapData';
import type { NpcProfile } from './world/types';

type DayPhase = 'morning' | 'day' | 'evening';
interface DayPresenceConfig {
  npcId: string;
  name: string;
  homeNodeId: string;
  awayNodeId: string;
  awayDistrictId?: string;
  awayChance: number;
  awayNote: string;
  availablePhases?: DayPhase[];
  unavailableNote?: string;
}

interface DaySeed {
  id: string;
  npcName: string;
  speaker: string;
  tier: number;
  factionId: string;
  role: string;
  greeting: string;
  lore: string;
  dayQuestTitle: string;
  dayQuestText: string;
}

const DAY_PHASES: DayPhase[] = ['morning', 'day', 'evening'];

const DAY_SEEDS: DaySeed[] = [
  { id: 'altufyevo', npcName: 'Складовик Илья', speaker: 'ИЛЬЯ', tier: 1, factionId: 'NULLPOINTERS', role: 'Дневной куратор запчастей', greeting: 'Смена открыта, прайс живой.', lore: 'Днем собирает цепочки поставок для северных силосов.', dayQuestTitle: '[DAY] Логистика Силосов', dayQuestText: 'Проверь дневные поставки в Алтуфьево и закрой разрыв в списках отгрузки.' },
  { id: 'vykhino', npcName: 'Бригадир Рельс', speaker: 'РЕЛЬС', tier: 1, factionId: 'RUST_VALLEY', role: 'Смотрящий карго-дока', greeting: 'Доки открыты до заката.', lore: 'Контролирует дневной поток карго в ржавом секторе.', dayQuestTitle: '[DAY] Очередь карго', dayQuestText: 'Разгрузи конфликт заявок на карго-линии и верни поток в график.' },
  { id: 'maryino', npcName: 'Инспектор Лена', speaker: 'ИНСПЕКТОР ЛЕНА', tier: 1, factionId: 'REGULATORS', role: 'Дневной координатор инцидентов', greeting: 'Протоколы ведутся.', lore: 'Сводит дневные жалобы района в общий журнал.', dayQuestTitle: '[DAY] Реестр Марьино', dayQuestText: 'Проверь три инцидентных записи и синхронизируй журнал до вечерней смены.' },
  { id: 'chertanovo', npcName: 'Маркер', speaker: 'МАРКЕР', tier: 2, factionId: 'NULLPOINTERS', role: 'Картограф серых зон', greeting: 'Отмечаю точки, не людей.', lore: 'Днем наносит на карту новые “серые” карманы.', dayQuestTitle: '[DAY] Новые метки', dayQuestText: 'Собери телеметрию по серым узлам Чертаново и обнови сетку риска.' },
  { id: 'south_west', npcName: 'Староста Нора', speaker: 'СТАРОСТА НОРА', tier: 2, factionId: 'SILICON_HEDGE', role: 'Куратор кампусной смены', greeting: 'Расписание сдвинулось, как обычно.', lore: 'Распределяет дневные учебные и боевые слоты.', dayQuestTitle: '[DAY] График Кампуса', dayQuestText: 'Закрой конфликт расписания между лабораторией и боевым стендом.' },
  { id: 'teply_stan', npcName: 'Егерь Вет', speaker: 'ЕГЕРЬ ВЕТ', tier: 1, factionId: 'BIOSYNDICATE', role: 'Дневной патруль биосектора', greeting: 'Тропа чистая, пока.', lore: 'Следит за границей биосети в светлое время.', dayQuestTitle: '[DAY] Дневной Патруль', dayQuestText: 'Проверь дневной маршрут патруля и отметь участок с деградацией сигнала.' },
  { id: 'izmailovo', npcName: 'Куратор Витрин', speaker: 'КУРАТОР', tier: 2, factionId: 'SILICON_HEDGE', role: 'Админ торговых витрин', greeting: 'Витрины на боевом режиме.', lore: 'Держит клиентские панели района в uptime.', dayQuestTitle: '[DAY] Витринный SLA', dayQuestText: 'Стабилизируй клиентские витрины до вечернего трафика.' },
  { id: 'bibirevo', npcName: 'Диспетчер Пакет', speaker: 'ПАКЕТ', tier: 1, factionId: 'REDUNDANTS', role: 'Дневной узел резервов', greeting: 'Резервы в онлайне.', lore: 'Поднимает дублирующие контуры района при дневных просадках.', dayQuestTitle: '[DAY] Резерв Бибирево', dayQuestText: 'Проверь контур резервирования и закрой критичный алерт.' },
  { id: 'tekstilschiki', npcName: 'Мастер Шов', speaker: 'ШОВ', tier: 2, factionId: 'REDUNDANTS', role: 'Оператор цеховых скриптов', greeting: 'Конвейер не любит задержек.', lore: 'Сшивает производственные скрипты в единый поток.', dayQuestTitle: '[DAY] Цеховая Стабильность', dayQuestText: 'Локализуй узел, который рвет поток на производственной линии.' },
  { id: 'perovo', npcName: 'Транзит Паша', speaker: 'ПАША', tier: 2, factionId: 'NET_DRIVERS', role: 'Маршрутизатор дневных коридоров', greeting: 'Коридоры открыты.', lore: 'Выдает дневные окна для межрайонного транзита.', dayQuestTitle: '[DAY] Коридор Перово', dayQuestText: 'Согласуй маршрутный коридор и сними конфликт с соседним районом.' },
  { id: 'sokol', npcName: 'Аудитор Риск', speaker: 'РИСК', tier: 3, factionId: 'KRYLOVO_CORP', role: 'Дневной контролер метрик', greeting: 'Покажи мне цифры.', lore: 'Отслеживает риск-профиль дорогих сегментов.', dayQuestTitle: '[DAY] Риск-Профиль', dayQuestText: 'Обнови риск-карту Сокола до открытия вечерней сессии.' },
  { id: 'vdnkh', npcName: 'Координатор Стенд', speaker: 'СТЕНД', tier: 2, factionId: 'TELECON', role: 'Куратор выставочных узлов', greeting: 'Павильоны открыты.', lore: 'Запускает дневные демонстрации без падений.', dayQuestTitle: '[DAY] Запуск Павильонов', dayQuestText: 'Подготовь выставочный контур и устрани предаварийный сигнал.' },
  { id: 'kitay_gorod', npcName: 'Хаб-Консьерж', speaker: 'КОНСЬЕРЖ', tier: 2, factionId: 'NET_DRIVERS', role: 'Дневной координатор хаба', greeting: 'Хаб в штатном режиме.', lore: 'Разводит дневные контракты между фракциями.', dayQuestTitle: '[DAY] Очередь Хаба', dayQuestText: 'Разгрузи очередь контрактов и закрой просроченный тикет центра.' },
  { id: 'sokolniki', npcName: 'Смотритель Кольца', speaker: 'КОЛЬЦО', tier: 2, factionId: 'NET_DRIVERS', role: 'Дневной сторож канала', greeting: 'Кольцевой канал держится.', lore: 'Следит за стабильностью паркового кольца.', dayQuestTitle: '[DAY] Канал Кольца', dayQuestText: 'Проверь кольцевой канал и устранить узел деградации.' },
  { id: 'fili', npcName: 'Брокер Линий', speaker: 'БРОКЕР', tier: 3, factionId: 'KRYLOVO_CORP', role: 'Дневной оператор шлюзов', greeting: 'Линии оплачены.', lore: 'Держит платежные шлюзы в рабочем диапазоне.', dayQuestTitle: '[DAY] Линии Филей', dayQuestText: 'Стабилизируй дневной платежный шлюз перед пиковым трафиком.' },
  { id: 'taganka', npcName: 'Куратор Ядра', speaker: 'КУРАТОР ЯДРА', tier: 4, factionId: 'REGULATORS', role: 'Дневной контроль критсегмента', greeting: 'Контур под контролем.', lore: 'Сопровождает инциденты верхнего уровня.', dayQuestTitle: '[DAY] Протокол Ядра', dayQuestText: 'Проведи проверку критического контура до вечернего окна регуляторов.' },
  { id: 'mitino', npcName: 'Лаборант Сигма', speaker: 'СИГМА', tier: 3, factionId: 'BIOSYNDICATE', role: 'Оператор биолабов', greeting: 'Капсулы в норме.', lore: 'Контролирует дневной цикл биоинкубаторов.', dayQuestTitle: '[DAY] Дневной Цикл', dayQuestText: 'Проверь дневной цикл инкубаторов и убери аномальную капсулу из потока.' },
  { id: 'academy', npcName: 'Методист Пинг', speaker: 'МЕТОДИСТ ПИНГ', tier: 1, factionId: 'SILICON_HEDGE', role: 'Куратор дневной практики', greeting: 'Практика по расписанию.', lore: 'Ставит студентам дневные боевые задания.', dayQuestTitle: '[DAY] Практикум Академии', dayQuestText: 'Закрой практический инцидент и передай отчет методисту.' },
];

export const getDayNpcId = (districtId: string) => `npc_day_${districtId}`;
export const getDayQuestId = (districtId: string) => `q_day_${districtId}_operations`;
export const getDayRouteQuestId = (districtId: string) => `q_day_${districtId}_neighbor_route`;

const DISTRICT_RING = DAY_SEEDS.map((s) => s.id);
const getNeighborDistrictId = (districtId: string): string => {
  const idx = DISTRICT_RING.indexOf(districtId);
  if (idx === -1) return 'kitay_gorod';
  return DISTRICT_RING[(idx + 1) % DISTRICT_RING.length];
};

export const DAY_CONTACT_PROFILES: NpcProfile[] = DAY_SEEDS.map((seed) => ({
  id: getDayNpcId(seed.id),
  name: seed.npcName,
  districtId: seed.id,
  role: seed.role,
  greeting: seed.greeting,
  shortLore: seed.lore,
  factionId: seed.factionId,
}));

export const DAY_CONTACT_PRESENCE: Record<string, DayPresenceConfig> = DAY_SEEDS.reduce((acc, seed) => {
  const npcId = getDayNpcId(seed.id);
  acc[npcId] = {
    npcId,
    name: seed.npcName,
    homeNodeId: npcId,
    awayNodeId: defaultAwayVisitNodeIdForDistrict(seed.id),
    awayDistrictId: seed.id,
    awayChance: 1,
    awayNote: 'Дневной контакт ушел на выездную проверку.',
    availablePhases: DAY_PHASES,
    unavailableNote: 'Дневная смена закрыта. Приходи утром.',
  };
  return acc;
}, {} as Record<string, DayPresenceConfig>);

export const DAY_CONTACT_DIALOGUES: Record<string, DialogueTree> = DAY_SEEDS.reduce((acc, seed) => {
  const npcId = getDayNpcId(seed.id);
  const questId = getDayQuestId(seed.id);
  const routeQuestId = getDayRouteQuestId(seed.id);
  const neighborId = getNeighborDistrictId(seed.id);
  acc[npcId] = new DialogueBuilder(npcId)
    .withDistrict(seed.id)
    .withGreetings({
      neutral: ['intro'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat'],
    })
    .addNode('intro', seed.speaker, `${seed.greeting} ${seed.lore}`, [
      { text: `[КОНТРАКТ] ${seed.dayQuestTitle}`, nextId: 'intro', awardQuestId: questId },
      { text: '[НАВОДКА] Кто в соседнем районе держит канал?', nextId: 'neighbor' },
      { text: '[КАРЬЕРА] Как выйти на путь профессии?', nextId: 'career' },
      { text: '[ЛОГИСТИКА] Нужен токен на поездку в соседний район.', nextId: 'token' },
      { text: '[ Уйти ]', nextId: 'LEAVE' },
    ])
    .addNode('intro_friendly', seed.speaker, 'Для тебя открою быстрый маршрут без очереди.', [
      { text: `[КОНТРАКТ] ${seed.dayQuestTitle}`, nextId: 'intro', awardQuestId: questId },
      { text: '[ Уйти ]', nextId: 'LEAVE' },
    ])
    .addNode('intro_hostile', seed.speaker, 'С таким профилем тебе только через общий терминал.', [{ text: '[ Уйти ]', nextId: 'LEAVE' }])
    .addNode('intro_stressed', seed.speaker, 'Сначала стабилизируйся, потом подписывай работу.', [{ text: '[ Уйти ]', nextId: 'LEAVE' }])
    .addNode('intro_repeat', seed.speaker, 'Есть еще один дневной слот, если тянет.', [
      { text: `[КОНТРАКТ] ${seed.dayQuestTitle}`, nextId: 'intro', awardQuestId: questId },
      { text: '[ Уйти ]', nextId: 'LEAVE' },
    ])
    .addNode('token', seed.speaker, 'Держи транспортный жетон. Один прыжок до соседнего района без оплаты.', [
      { text: '[ВЗЯТЬ ЖЕТОН]', nextId: 'intro', effect: 'GIVE_ITEM', cardRewardId: 'itm_taxi_token' },
    ])
    .addNode('neighbor', seed.speaker, `В соседнем секторе (${neighborId}) есть свой локальный куратор. Передай, что идешь по моей наводке.`, [
      { text: '[ПРИНЯТЬ МАРШРУТ]', nextId: 'intro', effect: 'GIVE_ITEM', cardRewardId: 'itm_taxi_token', awardQuestId: routeQuestId },
      { text: '[ НАЗАД ]', nextId: 'intro' },
    ])
    .addNode('career', seed.speaker, 'Путь к профессии открывается не сразу: подними третий уровень Script-Kiddo через Exploit-базу, затем иди на курс к Туранову.', [
      { text: 'Принял.', nextId: 'intro' },
    ])
    .build();
  return acc;
}, {} as Record<string, DialogueTree>);

export interface DayQuestSeed {
  districtId: string;
  title: string;
  description: string;
  giverNpcId: string;
  questId: string;
  routeQuestId: string;
  routeDescription: string;
  routeObjectiveNodeId: string;
  tier: number;
}

export const DAY_QUEST_SEEDS: DayQuestSeed[] = DAY_SEEDS.map((seed) => ({
  districtId: seed.id,
  title: seed.dayQuestTitle,
  description: seed.dayQuestText,
  giverNpcId: getDayNpcId(seed.id),
  questId: getDayQuestId(seed.id),
  routeQuestId: getDayRouteQuestId(seed.id),
  routeDescription: `Дневной куратор ${seed.npcName} направляет тебя в соседний район (${getNeighborDistrictId(seed.id)}): проверь контактную линию и вернись с подтверждением маршрута.`,
  routeObjectiveNodeId: getDayNpcId(getNeighborDistrictId(seed.id)),
  tier: seed.tier,
}));
