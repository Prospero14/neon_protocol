import { DialogueBuilder } from './dialogueUtils';
import type { DialogueTree } from './dialogues';
import { defaultAwayVisitNodeIdForDistrict } from './mapNavUtils';
import type { NpcProfile } from './world/types';

type NightPhase = 'night';
interface NightPresenceConfig {
  npcId: string;
  name: string;
  homeNodeId: string;
  awayNodeId: string;
  awayDistrictId?: string;
  awayChance: number;
  awayNote: string;
  availablePhases?: NightPhase[];
  unavailableNote?: string;
}

interface DistrictNightSeed {
  id: string;
  npcName: string;
  speaker: string;
  tier: number;
  factionId: string;
  role: string;
  greeting: string;
  shortLore: string;
  intro: string;
  friendly: string;
  hostile: string;
  stressed: string;
  repeat: string;
  loreLine: string;
  signalTitle: string;
  signalText: string;
  sweepTitle: string;
  sweepText: string;
}

const DISTRICT_NIGHT_SEEDS: DistrictNightSeed[] = [
  { id: 'altufyevo', npcName: 'Лампа-47', speaker: 'ЛАМПА-47', tier: 1, factionId: 'NULLPOINTERS', role: 'Куратор неоновых крыш', greeting: 'Свет не врет.', shortLore: 'Читает аварии по дрожанию старых вывесок.', intro: 'Алтуфьево живет на остаточном токе. Я веду тех, кто слышит треск линий.', friendly: 'Ты уже гасил шум на Силосах. Работать можно.', hostile: 'С твоим следом сюда приходят не задачи, а проблемы.', stressed: 'Дрожишь сильнее, чем вывески. Стабилизируйся.', repeat: 'До рассвета успеем еще один прогон.', loreLine: 'Неон держит память о каждой драке за район. Я только умею ее читать.', signalTitle: '[NIGHT] Пульс вывесок', signalText: 'Три вывески в Силосах шлют ложную телеметрию. Сними метрики и верни чистый снимок.', sweepTitle: '[NIGHT] Крыша без ретранслятора', sweepText: 'На крыше закрепили паразитный ретранслятор. Отключи узел, пока не проснулся дневной патруль.' },
  { id: 'vykhino', npcName: 'Кувалда', speaker: 'КУВАЛДА', tier: 1, factionId: 'RUST_VALLEY', role: 'Ночной диспетчер карго', greeting: 'Карго не спит.', shortLore: 'Ведет серые грузы по ржавым туннелям.', intro: 'Ночью в Выхино груз важнее закона. Берешь смену - держишь слово.', friendly: 'Вижу, ты не теряешь пакеты в шуме.', hostile: 'Ты слишком заметный для моих маршрутов.', stressed: 'Пульс высокий. Карго таких не любит.', repeat: 'Есть еще один рейс до первого состава.', loreLine: 'Если груз дошел до адресата - историю никто не пишет. Это моя работа.', signalTitle: '[NIGHT] Карго-телеметрия', signalText: 'Проверь метки контейнеров и найди, где подменили маршрутный хэш.', sweepTitle: '[NIGHT] Чистый коридор', sweepText: 'Сбей группу перехвата на транзитном канале и очисти путь для ночного груза.' },
  { id: 'maryino', npcName: 'Сержа', speaker: 'СЕРЖА', tier: 1, factionId: 'REGULATORS', role: 'Оператор уличных камер', greeting: 'Камеры видят все.', shortLore: 'Сводит ночные инциденты до того, как они попадают в отчеты.', intro: 'В Марьино ночь длинная, а журналы короткие. Нужен человек на грязные задачи.', friendly: 'С тобой отчеты выходят без красных строк.', hostile: 'Твой профиль риска выше моего лимита.', stressed: 'Ты шумный. Камеры от такого горят.', repeat: 'Окно еще открыто, можно закрыть один хвост.', loreLine: 'Днем камеры кормят начальство. Ночью они спасают тех, кто выживает на земле.', signalTitle: '[NIGHT] Слепая камера', signalText: 'Один сектор выпал из сети. Подними канал и проверь, кто стер последние 20 минут.', sweepTitle: '[NIGHT] Двор без шипения', sweepText: 'В дворовом сегменте подняли шумный ботнет. Отключи его, пока не пошла волна по району.' },
  { id: 'chertanovo', npcName: 'Рубин', speaker: 'РУБИН', tier: 2, factionId: 'NULLPOINTERS', role: 'Сборщик темных логов', greeting: 'Логи пахнут правдой.', shortLore: 'Покупает и перепродает компромат ночных смен.', intro: 'Чертаново ночью пишет настоящую историю. Хочешь страницу с подписью?', friendly: 'Твои логи уже ходят как эталонные.', hostile: 'С тобой в пакетах всегда маяк.', stressed: 'Успокой канал. Я не беру дрожащие руки.', repeat: 'Есть еще одна папка без хозяина.', loreLine: 'Самый дорогой файл - тот, который не должен был существовать.', signalTitle: '[NIGHT] Потерянный дамп', signalText: 'Найди исчезнувший дамп инцидента и верни его до утренней проверки.', sweepTitle: '[NIGHT] Снять хвост', sweepText: 'Тебя засекли на выгрузке. Обруби преследующий узел и выведи след в ноль.' },
  { id: 'south_west', npcName: 'Тетрис', speaker: 'ТЕТРИС', tier: 2, factionId: 'SILICON_HEDGE', role: 'Ночной ассистент кампуса', greeting: 'Кампус закрыт, сеть открыта.', shortLore: 'Подчищает эксперименты студентов до прихода профессоров.', intro: 'После полуночи кампус честный: только код, ошибки и те, кто их чинит.', friendly: 'Ты не первый раз закрываешь чужие лабораторные.', hostile: 'Для тебя даже тестовая среда слишком привилегия.', stressed: 'С таким шумом не работают в чистой комнате.', repeat: 'Остался один стенд без смотрителя.', loreLine: 'Любая великая теория начинается с ночной правки без свидетелей.', signalTitle: '[NIGHT] Лабораторный пинг', signalText: 'Сними телеметрию с ночных стендов и выдели ложные срабатывания защиты.', sweepTitle: '[NIGHT] Тишина в аудитории', sweepText: 'В тестовом кластере застрял агрессивный процесс. Останови его без утечки в общий контур.' },
  { id: 'teply_stan', npcName: 'Ярь', speaker: 'ЯРЬ', tier: 1, factionId: 'BIOSYNDICATE', role: 'Полевой смотритель лесного сегмента', greeting: 'Лес слушает.', shortLore: 'Отслеживает аномалии на стыке биосети и старых роутеров.', intro: 'В лесу ночью слышно, как сеть дышит. Если умеешь слушать - найдешь источник сбоя.', friendly: 'Ты ходишь тихо. Лес таким доверяет.', hostile: 'С твоим следом сюда приходят хищники.', stressed: 'Слишком резкий ритм. Здесь так не выживают.', repeat: 'Еще один след не остыл.', loreLine: 'Природа не чинит баги. Она их перерабатывает. Мы просто не успеваем.', signalTitle: '[NIGHT] Биопульс', signalText: 'Считай метрики с лесного контура и отметь участок, где сигнал уходит в рекурсию.', sweepTitle: '[NIGHT] Глушитель охотников', sweepText: 'Ночные мародеры подняли маяк у кромки леса. Выключи его до рассвета.' },
  { id: 'izmailovo', npcName: 'Филин', speaker: 'ФИЛИН', tier: 2, factionId: 'SILICON_HEDGE', role: 'Архивариус ночных витрин', greeting: 'Витрины помнят.', shortLore: 'Собирает цифровые следы с торговых улиц Измайлово.', intro: 'Когда рынки закрыты, витрины говорят правду про клиентов. Я снимаю этот слой.', friendly: 'Твой профиль уже в белом списке моих архивов.', hostile: 'Ты приносишь больше шума, чем данных.', stressed: 'Сначала дыхание, потом дела.', repeat: 'Есть свежий след по вчерашнему налету.', loreLine: 'Самая тихая камера обычно пишет самый громкий скандал.', signalTitle: '[NIGHT] Отпечатки витрин', signalText: 'Сними цифровые отпечатки с торговой линии и найди подмену платежных логов.', sweepTitle: '[NIGHT] Налет без свидетелей', sweepText: 'Перехвати шумный скрипт-граббер, пока он не ушел в утренний трафик.' },
  { id: 'bibirevo', npcName: 'Монитор', speaker: 'МОНИТОР', tier: 1, factionId: 'REDUNDANTS', role: 'Оператор резервного контура', greeting: 'Резерв поднят.', shortLore: 'Держит дублирующие каналы Бибирево в живом состоянии.', intro: 'Если основной контур падает, мы включаем тень. Нужны руки на ночной бэкап.', friendly: 'Ты умеешь чинить без лишних вопросов.', hostile: 'Я не дам тебе доступ к резерву.', stressed: 'Стабильность сначала, геройство потом.', repeat: 'Есть еще один сегмент в желтом статусе.', loreLine: 'Резервная копия это не роскошь. Это вторая попытка для целого района.', signalTitle: '[NIGHT] Резервный heartbeat', signalText: 'Проверь heartbeat резервного узла и зафиксируй место деградации.', sweepTitle: '[NIGHT] Падение без каскада', sweepText: 'Останови локальный каскад ошибок, пока он не утянул основной контур.' },
  { id: 'tekstilschiki', npcName: 'Нить', speaker: 'НИТЬ', tier: 2, factionId: 'REDUNDANTS', role: 'Сшиватель производственных логов', greeting: 'Шов держится.', shortLore: 'Сшивает данные цехов в единый ночной реестр.', intro: 'Текстильщики любят порядок, даже в хаосе. Я сшиваю то, что рвется ночью.', friendly: 'Ты аккуратный. Таких здесь берегут.', hostile: 'С твоей статистикой я не дам тебе иглу.', stressed: 'Руки трясутся - шов поедет.', repeat: 'Остался один рваный участок.', loreLine: 'Любой поток данных можно распустить. Вопрос в том, успеешь ли сшить обратно.', signalTitle: '[NIGHT] Разрыв в журнале', signalText: 'Найди разрыв в ночном производственном журнале и восстанови непрерывность.', sweepTitle: '[NIGHT] Цех без дребезга', sweepText: 'Стабилизируй шумный цеховой сегмент до запуска утренней линии.' },
  { id: 'perovo', npcName: 'Портной', speaker: 'ПОРТНОЙ', tier: 2, factionId: 'NET_DRIVERS', role: 'Маршрутизатор нелегальных каналов', greeting: 'Порт открыт.', shortLore: 'Сшивает временные туннели между разными фракциями.', intro: 'Перово стоит на перекрестке чужих интересов. Я держу каналы, пока все спят.', friendly: 'С тобой маршруты не сыпятся.', hostile: 'Твой ключ отозван.', stressed: 'Сначала выровняйся, потом в туннель.', repeat: 'Есть еще один маршрут на прошивку.', loreLine: 'Лучший туннель тот, который утром никто не найдет.', signalTitle: '[NIGHT] Туннельный пинг', signalText: 'Проверь устойчивость временного туннеля и закрой дыру в шифре.', sweepTitle: '[NIGHT] Перекресток без пробок', sweepText: 'Разбери конфликт маршрутов и зачисти узел от агрессивного посредника.' },
  { id: 'sokol', npcName: 'Гранд', speaker: 'ГРАНД', tier: 3, factionId: 'KRYLOVO_CORP', role: 'Ночной риск-менеджер квартала', greeting: 'Риски считаны.', shortLore: 'Закрывает дорогие инциденты до открытия биржи.', intro: 'На Соколе ошибки стоят дорого. Ночью мы платим тем, кто умеет их гасить тихо.', friendly: 'Ты показываешь результат без лишней драмы.', hostile: 'Твой кредит доверия исчерпан.', stressed: 'Риск-профиль красный. Возвращайся позже.', repeat: 'Остался один счет, который надо закрыть до утра.', loreLine: 'Рынок прощает только тех, кто чинит раньше отчета.', signalTitle: '[NIGHT] Риск-скан', signalText: 'Снимай ночные метрики с премиум-кластера и обозначь точку предаварийного риска.', sweepTitle: '[NIGHT] Нулевая просадка', sweepText: 'Локализуй источник просадки и верни сегмент в зеленую зону до открытия сессии.' },
  { id: 'vdnkh', npcName: 'Павильонщик', speaker: 'ПАВИЛЬОНЩИК', tier: 2, factionId: 'TELECON', role: 'Куратор выставочного контура', greeting: 'Павильоны на связи.', shortLore: 'Поддерживает шоу-сегменты ВДНХ, когда зрителей уже нет.', intro: 'Ночью павильоны честные: без света, без рекламы, только реальная телеметрия.', friendly: 'С тобой экспозиция не падает посреди цикла.', hostile: 'Я не подписываю доступ случайным людям.', stressed: 'Погаси внутренний шум, потом заходи в контур.', repeat: 'Еще одна линия готова к проверке.', loreLine: 'Самая красивая витрина держится на самой скучной ночной рутине.', signalTitle: '[NIGHT] Экспо-метрики', signalText: 'Сними ночные метрики с павильонов и найди подмененный датчик нагрузки.', sweepTitle: '[NIGHT] Шоу без сбоя', sweepText: 'Отключи агрессивный демон в выставочном контуре, чтобы утренний запуск прошел чисто.' },
  { id: 'kitay_gorod', npcName: 'Полночный Раннер', speaker: 'ПОЛНОЧНЫЙ РАННЕР', tier: 2, factionId: 'NET_DRIVERS', role: 'Курьер хабовых секретов', greeting: 'Хаб бодрствует.', shortLore: 'Перевозит пакеты, которые нельзя проводить днем.', intro: 'Китай-Город ночью решает то, что днем обсуждают. Нужны руки без лишних вопросов.', friendly: 'Ты держишь тайминг, значит можешь брать сложнее.', hostile: 'У тебя слишком много чужих глаз за спиной.', stressed: 'С твоим ритмом ты сорвешь дроп.', repeat: 'Есть еще одна доставка до рассвета.', loreLine: 'В хабе ценят не скорость. Ценят тишину после выполнения.', signalTitle: '[NIGHT] Тихий дроп', signalText: 'Проверь целостность ночного пакета и подтверди маршрут без утечки.', sweepTitle: '[NIGHT] Ложный след', sweepText: 'Запусти отвлекающий контур и срежь преследующий хвост регуляторов.' },
  { id: 'sokolniki', npcName: 'Кедр', speaker: 'КЕДР', tier: 2, factionId: 'NET_DRIVERS', role: 'Полевой связист паркового кольца', greeting: 'Кольцо живо.', shortLore: 'Держит связь на стыке парка и техсектора.', intro: 'В Сокольниках ночью сигнал уходит в зелень. Я собираю то, что оттуда возвращается.', friendly: 'Ты не теряешь ориентир даже в слепых зонах.', hostile: 'Связь с тобой слишком дорогая.', stressed: 'Сначала дыхание. Потом эфир.', repeat: 'Остался один сектор без покрытия.', loreLine: 'Самые тихие места дают самую точную телеметрию.', signalTitle: '[NIGHT] Кольцевой канал', signalText: 'Сними данные с паркового кольца и найди сектор с деградацией сигнала.', sweepTitle: '[NIGHT] Эфир без эха', sweepText: 'Выключи паразитный передатчик, который давит ночную связь в районе.' },
  { id: 'fili', npcName: 'Карбон', speaker: 'КАРБОН', tier: 3, factionId: 'KRYLOVO_CORP', role: 'Ночной контролер финансовых шлюзов', greeting: 'Шлюзы под контролем.', shortLore: 'Гасит аномалии платежных контуров в Филях.', intro: 'Фили ночью считают деньги и ошибки. Помоги не перепутать одно с другим.', friendly: 'С тобой шлюзы закрываются чисто.', hostile: 'Ты не пройдешь аудит доверия.', stressed: 'Слишком нестабильно для финансового контура.', repeat: 'Есть еще один шлюз на грани.', loreLine: 'Любая утечка начинается с маленькой скидки на внимательность.', signalTitle: '[NIGHT] Баланс шлюза', signalText: 'Проверь ночной платежный шлюз и найди расхождение в контрольных суммах.', sweepTitle: '[NIGHT] Отбой фишинга', sweepText: 'Останови активный фишинговый скрипт до открытия дневной кассы.' },
  { id: 'taganka', npcName: 'Протокол-13', speaker: 'ПРОТОКОЛ-13', tier: 4, factionId: 'REGULATORS', role: 'Оператор закрытого ядра', greeting: 'Ядро не спит.', shortLore: 'Ведет самые чувствительные инциденты Таганки.', intro: 'На Таганке ночь - это режим повышенного доступа. Ошибок не прощают.', friendly: 'Тебя допускают ближе к ядру. Не подведи.', hostile: 'Доступ отклонен. Причина: риск утечки.', stressed: 'Пульс вне допуска. Контур закрыт.', repeat: 'Остался инцидент уровня черный.', loreLine: 'Утро видит только итоги. Ночь оплачивает их цену.', signalTitle: '[NIGHT] Черный журнал', signalText: 'Подними закрытый журнал инцидентов и выдели строку с поддельной подписью.', sweepTitle: '[NIGHT] Ядро без дрейфа', sweepText: 'Локализуй дрейф критического процесса и верни ядро в стабильный диапазон.' },
  { id: 'mitino', npcName: 'Роса', speaker: 'РОСА', tier: 3, factionId: 'BIOSYNDICATE', role: 'Куратор био-инкубаторов', greeting: 'Инкубаторы дышат.', shortLore: 'Смотрит за ночным циклом био-лабораторий в Митино.', intro: 'В Митино ночь - время роста. Помоги, чтобы рост не стал мутацией.', friendly: 'С тобой цикл проходит без аварий.', hostile: 'Ты не в белом списке лаборатории.', stressed: 'Нестабильный оператор опаснее нестабильной культуры.', repeat: 'Еще одна капсула просит проверки.', loreLine: 'Биосеть не различает добро и зло. Только стабильность и распад.', signalTitle: '[NIGHT] Инкубаторный цикл', signalText: 'Сними метрики с ночного цикла и найди капсулу с аномальным ростом.', sweepTitle: '[NIGHT] Стерильный коридор', sweepText: 'Останови зараженный процесс в лабораторном сегменте до утренней смены.' },
  { id: 'academy', npcName: 'Ассемблер', speaker: 'АССЕМБЛЕР', tier: 1, factionId: 'SILICON_HEDGE', role: 'Старший лаборант ночной практики', greeting: 'Практика началась.', shortLore: 'Ставит студентам реальные задачи после отбоя.', intro: 'Ночью Академия учит без лекций. Только ты, ошибка и дедлайн до рассвета.', friendly: 'Ты думаешь как инженер, а не как заучка.', hostile: 'Ночная практика не для тех, кто ломает стенды.', stressed: 'Сначала соберись. Потом вход в лабораторию.', repeat: 'Есть еще один стенд для ночного разбора.', loreLine: 'Дневной диплом показывает знания. Ночная смена показывает характер.', signalTitle: '[NIGHT] Учебный стенд', signalText: 'Проверь телеметрию учебного стенда и выдели скрытую регрессию.', sweepTitle: '[NIGHT] Экзамен без шпаргалок', sweepText: 'Закрой аварийный сценарий на боевом макете до открытия кампуса.' },
];

const NIGHT_PHASES: NightPhase[] = ['night'];

export const getNightNpcId = (districtId: string) => `npc_night_${districtId}`;
export const getNightQuestSignalId = (districtId: string) => `q_night_${districtId}_signal`;
export const getNightQuestSweepId = (districtId: string) => `q_night_${districtId}_sweep`;

export const NIGHT_CONTACT_PROFILES: NpcProfile[] = DISTRICT_NIGHT_SEEDS.map((seed) => ({
  id: getNightNpcId(seed.id),
  name: seed.npcName,
  districtId: seed.id,
  role: seed.role,
  greeting: seed.greeting,
  shortLore: seed.shortLore,
  factionId: seed.factionId,
}));

export const NIGHT_CONTACT_PRESENCE: Record<string, NightPresenceConfig> = DISTRICT_NIGHT_SEEDS.reduce(
  (acc, seed) => {
    const npcId = getNightNpcId(seed.id);
    acc[npcId] = {
      npcId,
      name: seed.npcName,
      homeNodeId: npcId,
      awayNodeId: defaultAwayVisitNodeIdForDistrict(seed.id),
      awayDistrictId: seed.id,
      awayChance: 1,
      awayNote: 'Записка в терминале: ушел на периметр, вернусь до рассвета.',
      availablePhases: NIGHT_PHASES,
      unavailableNote: 'Контакт этой смены оффлайн. Приходи ночью.',
    };
    return acc;
  },
  {} as Record<string, NightPresenceConfig>
);

export const NIGHT_CONTACT_DIALOGUES: Record<string, DialogueTree> = DISTRICT_NIGHT_SEEDS.reduce(
  (acc, seed) => {
    const npcId = getNightNpcId(seed.id);
    const signalQuestId = getNightQuestSignalId(seed.id);
    const sweepQuestId = getNightQuestSweepId(seed.id);
    acc[npcId] = new DialogueBuilder(npcId)
      .withDistrict(seed.id)
      .withGreetings({
        neutral: ['intro'],
        friendly: ['intro_friendly'],
        hostile: ['intro_hostile'],
        stressed: ['intro_stressed'],
        repeat: ['intro_repeat'],
      })
      .addNode(
        'intro',
        seed.speaker,
        seed.intro,
        [
          { text: `[КОНТРАКТ] ${seed.signalTitle}`, nextId: 'intro', awardQuestId: signalQuestId },
          { text: `[КОНТРАКТ] ${seed.sweepTitle}`, nextId: 'intro', awardQuestId: sweepQuestId },
          { text: 'Кто ты в этой сети?', nextId: 'lore' },
          { text: '[ Уйти ]', nextId: 'LEAVE' },
        ]
      )
      .addNode('intro_friendly', seed.speaker, seed.friendly, [
        { text: `[КОНТРАКТ] ${seed.signalTitle}`, nextId: 'intro', awardQuestId: signalQuestId },
        { text: '[ Уйти ]', nextId: 'LEAVE' },
      ])
      .addNode('intro_hostile', seed.speaker, seed.hostile, [{ text: '[ Уйти ]', nextId: 'LEAVE' }])
      .addNode('intro_stressed', seed.speaker, seed.stressed, [{ text: '[ Уйти ]', nextId: 'LEAVE' }])
      .addNode('intro_repeat', seed.speaker, seed.repeat, [
        { text: `[КОНТРАКТ] ${seed.sweepTitle}`, nextId: 'intro', awardQuestId: sweepQuestId },
        { text: '[ Уйти ]', nextId: 'LEAVE' },
      ])
      .addLoreNode('lore', seed.speaker, seed.loreLine, 'intro')
      .build();
    return acc;
  },
  {} as Record<string, DialogueTree>
);

export interface NightQuestSeed {
  districtId: string;
  signalTitle: string;
  signalText: string;
  sweepTitle: string;
  sweepText: string;
  giverNpcId: string;
  signalQuestId: string;
  sweepQuestId: string;
  tier: number;
  objectiveNodeId?: string;
}

export const NIGHT_QUEST_SEEDS: NightQuestSeed[] = DISTRICT_NIGHT_SEEDS.map((seed) => {
  return {
    districtId: seed.id,
    signalTitle: seed.signalTitle,
    signalText: seed.signalText,
    sweepTitle: seed.sweepTitle,
    sweepText: seed.sweepText,
    giverNpcId: getNightNpcId(seed.id),
    signalQuestId: getNightQuestSignalId(seed.id),
    sweepQuestId: getNightQuestSweepId(seed.id),
    tier: seed.tier,
  };
});
