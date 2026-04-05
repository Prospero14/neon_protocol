import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const hub_dialogues: Record<string, DialogueTree> = {
  // --- KITAY-GOROD HUB (THE SOCKET BAR) ---
  kitay_gorod: new DialogueBuilder('kitay_gorod')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'MENU', 'Бар "The Socket" — перекресток нулей и единиц. Здесь пахнет синтехолом и кремнием. На стенах мерцает GigaBank, в тени сидят Nullpointers.', [
      { text: 'Spider (Связник Nullpointers)', nextId: 'spider_intro' },
      { text: 'Mira (Silicon Hedge)', nextId: 'mira_intro' },
      { text: 'Агент ГБ (В тени)', nextId: 'gb_intro' },
      { text: 'Бармен (Заправить кэш)', nextId: 'bar_hub' },
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'MENU', 'В баре шумно. Стажеры обсуждают уязвимости Октября, охранники GigaBank сканируют толпу. Здесь корпоративная догма встречается con хаосом Пустоты.', [
      { text: 'Spider (Связник)', nextId: 'spider_intro' },
      { text: 'Mira (Silicon Hedge)', nextId: 'mira_intro' },
      { text: 'Агент ГБ', nextId: 'gb_intro' },
      { text: 'Бармен', nextId: 'bar_hub' },
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'MENU', 'В "The Socket" тебя узнают. Бармен кивает, агент ГБ отводит взгляд, а Spider делает знак "свой". Ты стал частью фольклора.', [
      { text: 'Осмотреться.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile', 'MENU', 'Атмосфера меняется. Разговоры затихают. Агент ГБ кладет руку на кобуру. Твоя репутация делает тебя мишенью.', [
      { text: 'Уйти по-доброму.', nextId: 'LEAVE' }
    ])
    .addNode('gb_intro', 'АГЕНТ ГБ', 'Ваши логи подозрительно чисты. GigaBank ценит прозрачность. Хотите внести вклад в безопасность или вы здесь по "темным" делам?', [
      { text: 'Я за порядок. ( +10 GIGABANK )', nextId: 'gb_loyalty', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'GIGA_BANK' },
      { text: 'Кто такие GigaBank?', nextId: 'lore_gb' },
      { text: 'Мне нужна верификация подписи.', nextId: 'quest_signature_finish', requireQuestId: 'q_taganka_bribe_negotiation' },
      { text: 'Просто пью кофе.', nextId: 'intro' },
      { text: '[ Плюнуть в терминал ] ( -15 GIGABANK )', nextId: 'gb_hostile', effect: 'GIVE_REPUTATION', amount: -15, cardRewardId: 'GIGA_BANK' }
    ])
    .addNode('quest_signature_finish', 'АГЕНТ ГБ', 'Подпись Аудитора? *сканирует* Хм... Валидно. Твой профиль теперь в "Реестре Доверенных". Это откроет двери в Верхний Город. (+Bits)', [
      { text: 'Ценю это. (Завершить)', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_hub_digital_signature' }
    ])
    .addLoreNode('lore_gb', 'АГЕНТ ГБ', 'Мы — кровеносная система экономики Москвы. Без нас Bits не имеют веса. Мы гарантируем стабильность. Хаос — наш общий враг. (+Intel: GigaBank)', 'gb_intro', 'GigaBank')
    .addNode('gb_loyalty', 'АГЕНТ ГБ', 'Правильный выбор. Мы пришлем список аномалий в Чертаново. Стабильность — это валюта.', [
      { text: 'Принято.', nextId: 'intro' }
    ])
    .addNode('gb_hostile', 'АГЕНТ ГБ', 'Занесено в протокол. Ваша история будет скорректирована. Уходите, пока я не вызвал группу Аудита.', [
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .addNode('spider_intro', 'SPIDER', 'Тише, неофит. Nullpointers не прощают болтливости. Мы — призраки в машине. Ищешь правду или просто Bits?', [
      { text: 'Ищу способ взломать Систему.', nextId: 'spider_lore' },
      { text: 'Кто такие Nullpointers?', nextId: 'lore_null' },
      { text: 'Нужен спец-софт. (50 Bits)', nextId: 'spider_trade', cost: 50, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
      { text: 'Слава Свободным Данным! ( +10 NULLPOINTERS )', nextId: 'spider_loyalty', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' },
      { text: '[ Назад ]', nextId: 'intro' }
    ])
    .addLoreNode('lore_null', 'SPIDER', 'Мы — те, кто выпал из реестров. Код принадлежит всем, а не High-Tier Сити. Мы — ошибка, которую невозможно исправить. (+Intel: Nullpointers)', 'spider_intro', 'Nullpointers')
    .addNode('spider_loyalty', 'SPIDER', 'Наш человек. ГигаБанк считает нас багом, но мы — сама ОС реальности. Держи ключ, пригодится в Гетто.', [
      { text: 'Смерть Корпоратам.', nextId: 'intro' }
    ])
    .addLoreNode('spider_lore', 'SPIDER', 'В 2024-м Ядро Октября лишилось контроля над Moscow Zero. Пакеты всё равно теряются. Мы — те самые пакеты, обретшие волю.', 'spider_intro')
    .addNode('mira_intro', 'MIRA (NK)', 'Точность. Честь. Кремний. Нас интересует эффективность. У тебя в логах мусор. Хочешь апгрейд или будешь лагать всю жизнь?', [
      { text: 'Узнать про Silicon Hedge.', nextId: 'lore_hedge' },
      { text: 'Купить чип стабилизации (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_BITS', amount: 128 },
      { text: '[ Назад ]', nextId: 'intro' }
    ])
    .addLoreNode('lore_hedge', 'MIRA (NK)', 'Мы — следующая итерация. Плоть слаба, мысли медленны. Мы стремимся к чистому осознанию без потерь. Мы — идеальный процесс. (+Intel: Silicon Hedge)', 'mira_intro', 'Silicon Hedge')
    .addNode('bar_hub', 'БАРМЕН', 'Коктейль "NullPointerException"? У нас акция для лояльных клиентов и выживших после рекурсии.', [
      { text: 'Бесплатный напиток [ ТРЕБУЕТ GIGABANK: 20 ]', nextId: 'bar_free', requireReputation: { factionId: 'GIGABANK', minPoints: 20 } },
      { text: 'Купить "Дебаг" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 30 },
      { text: 'Назад', nextId: 'intro' }
    ])
    .addNode('bar_free', 'БАРМЕН', 'Уважаемый гость. GigaBank оплатил ваш счет за лояльность. Пейте на здоровье своего нейростека.', [
      { text: 'За GigaBank!', nextId: 'intro', effect: 'RESTORE_HP', amount: 50 }
    ])
    .build(),

  // --- CYBERDECK AI (TUTORIAL / LORE) ---
  npc_deck_ai: new DialogueBuilder('npc_deck_ai', 'boot_0')
    .addNode('boot_0', 'AIDA-01', '>>> Инициализация... биометрия [OK]\n>>> РЕГИСТРАЦИЯ: ОПЕРАТОР_0. Я — ассистент AIDA-01. Твоё сознание синхронизировано con сетью Октября. Каков запрос?', [
      { text: 'Где я? [ LOCALHOST? ]', nextId: 'lore_1' },
      { text: 'Твой профиль? [ ASISTANT ]', nextId: 'career_intro' }
    ])
    .addNode('lore_1', 'AIDA-01', 'Ты в Москве. Мир разрезан надвое. Внизу — технические трущобы. Наверху — Архитекторы. Ты — чистый лист в системе Октября.', [
      { text: 'Какие пути есть в этом мире?', nextId: 'career_intro' }
    ])
    .addNode('career_intro', 'AIDA-01', 'Октябрь имеет два типа допусков: Языковые Стэки и Инженерные Роли. Для восхождения потребуется Класс. О какой категории хочешь узнать?', [
      { text: '[ КАТЕГОРИЯ: ЯЗЫКОВЫЕ СТЭКИ ]', nextId: 'langs_menu' },
      { text: '[ КАТЕГОРИЯ: ИНЖЕНЕРНЫЕ РОЛИ ]', nextId: 'roles_menu' },
      { text: 'Я готов начать свой путь.', nextId: 'LEAVE' }
    ])
    .addNode('langs_menu', 'AIDA-01', 'Языки определяют стиль боя. Каждый синтаксис — оружие. Выбери поток для анализа:', [
      { text: 'Java: Путь Корпората', nextId: 'desc_java' },
      { text: 'Python: Спектр Автоматизации', nextId: 'desc_python' },
      { text: 'Kotlin: Мобильный Форсаж', nextId: 'desc_kotlin' },
      { text: 'Go: Параллельная Реальность', nextId: 'desc_go' },
      { text: 'JavaScript: Визуальный Хаос', nextId: 'desc_js' },
      { text: '[ Вернуться ]', nextId: 'career_intro' }
    ])
    .addNode('roles_menu', 'AIDA-01', 'Специализации определяют твою роль в иерархии. Это не просто код, это влияние на структуру города.', [
      { text: 'DevOps: Строитель Путей', nextId: 'desc_devops' },
      { text: 'SysAdmin: Хранитель Уровня', nextId: 'desc_admin' },
      { text: 'Architect: Визионер Структуры', nextId: 'desc_arch' },
      { text: 'Project Manager: Вектор Хаоса', nextId: 'desc_pm' },
      { text: 'QA Tester: Инквизитор Багов', nextId: 'desc_qa' },
      { text: '[ Вернуться ]', nextId: 'career_intro' }
    ])
    .addNode('desc_java', 'AIDA-01', 'Java Junior: Фундамент старого мира. Твой код — крепость. Надежно. Используется в глубоких слоях GigaBank.', [{ text: 'Понятно.', nextId: 'langs_menu' }])
    .addNode('desc_python', 'AIDA-01', 'Python Developer: Скорость мысли. Идеально для взлома нейросетей. Игнорируй оптимизацию, если код уже взломал шлюз.', [{ text: 'Понятно.', nextId: 'langs_menu' }])
    .addNode('desc_devops', 'AIDA-01', 'DevOps Engineer: Ты строишь конвейеры. Автоматизация развертывания вирусов через CI/CD протоколы.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
    .addNode('desc_admin', 'AIDA-01', 'System Administrator: Прямой доступ к железу. Управление питанием и полномочия root в твоем секторе.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
    .addNode('desc_arch', 'AIDA-01', 'System Architect: Высшая каста. Ты не фиксишь баги, ты создаешь законы. Самый сложный путь к вершине.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
    .addNode('desc_pm', 'AIDA-01', 'Project Manager: Управление ресурсами. Твои карты заставляют других работать на тебя. Лидерство — твоё оружие.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
    .addNode('desc_qa', 'AIDA-01', 'QA Tester: Ты видишь изъяны. Твои атаки находят слабые места, превращая чужую уверенность в ошибку.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
    .build(),

  // --- SYSTEM STUBS ---
  GENERIC_STUB: new DialogueBuilder('GENERIC_STUB')
    .addNode('intro', 'SYSTEM', '[ОШИБКА_ИНИЦИАЛИЗАЦИИ] Узел существует в топологии, но протокол диалога не найден. Скорее всего, данные повреждены или находятся в разработке.', [
      { text: '[ ПИНГОВАТЬ СНОВА ]', nextId: 'intro' },
      { text: '[ РАЗОРВАТЬ СОЕДИНЕНИЕ ]', nextId: 'LEAVE' }
    ])
    .build(),
};
