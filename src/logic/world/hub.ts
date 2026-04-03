import type { WorldDistrict } from './types';

export const hub: WorldDistrict = {
  id: 'kitay_gorod',
  node: {
    id: 'kitay_gorod', 
    name: 'КИТАЙ-ГОРОД: THE_SOCKET', 
    description: 'Бар "The Socket" — перекресток нулей и единиц. Здесь пахнет дешевым синтехолом и перегретым кремнием.', 
    x: 52, y: 55, stability: 100, type: 'hub', tier: 2,
    subNodes: [
      { id: 'npc_spider', name: 'Spider (VOID)', type: 'npc', description: 'Связник анархистов.', x: 20, y: 30 },
      { id: 'npc_mira', name: 'Mira (NK)', type: 'npc', description: 'Представитель NeoKyoto.', x: 80, y: 30 },
      { id: 'npc_gb_agent', name: 'Агент ГБ', type: 'npc', description: 'В тени за столиком.', x: 50, y: 70 },
      { id: 'npc_barman', name: 'Бармен', type: 'npc', description: 'Заправиться охладом.', x: 10, y: 10 }
    ]
  },
  npcs: [
    { id: 'npc_spider', name: 'Spider', districtId: 'kitay_gorod', role: 'Связник VOID', greeting: 'Тише, неофит.', shortLore: 'Ищет правду под слоями шифрования.' },
    { id: 'npc_mira', name: 'Mira', districtId: 'kitay_gorod', role: 'NeoKyoto Rep', greeting: 'Точность. Честь. Кремний.', shortLore: 'Продает технологии NK.' },
  ],
  dialogues: {
    kitay_gorod: {
      id: 'kitay_gorod', startNodeId: 'intro',
      nodes: {
        intro: {
          id: 'intro', speaker: 'MENU', text: 'Бар "The Socket" — перекресток нулей и единиц. Здесь пахнет дешевым синтехолом и перегретым кремнием. На стенах мерцают голограммы "ГБ", обещающие стабильность в обмен на лояльность. В тени сидят те, чьи имена стерты из официальных реестров архивом "VOID".',
          options: [
            { text: 'Spider (Связник VOID)', nextId: 'spider_intro' },
            { text: 'Mira (Представитель NK)', nextId: 'mira_intro' },
            { text: 'Агент ГБ (В тени)', nextId: 'gb_intro' },
            { text: 'Бармен (Заправиться)', nextId: 'bar_hub' },
            { text: '[ УЙТИ ]', nextId: 'LEAVE' }
          ]
        },
        gb_intro: {
          id: 'gb_intro', speaker: 'АГЕНТ ГБ', text: 'Гражданин, ваши логи выглядят... подозрительно чистыми. ГигаБанк ценит прозрачность. Хотите внести вклад в безопасность сектора? Или вы здесь по "темным" делам?',
          options: [
            { text: 'Я за порядок. ( +10 ГБ )', nextId: 'gb_loyalty', reputationReward: { factionId: 'GIGA_BANK', amount: 10 } },
            { text: 'Просто пью кофе.', nextId: 'intro' },
            { text: '[ Плюнуть в терминал ] ( -15 ГБ )', nextId: 'gb_hostile', reputationReward: { factionId: 'GIGA_BANK', amount: -15 } }
          ]
        },
        gb_loyalty: { id: 'gb_loyalty', speaker: 'АГЕНТ ГБ', text: 'Правильный выбор. Мы пришлем вам список "аномальных" узлов. Помни: стабильность — это валюта будущего.', options: [{ text: 'Принято.', nextId: 'intro' }] },
        gb_hostile: { id: 'gb_hostile', speaker: 'АГЕНТ ГБ', text: 'Занесено в протокол. Ваша кредитная история будет... пересмотрена. Уходите, пока я не вызвал Аудит.', options: [{ text: '[ УЙТИ ]', nextId: 'LEAVE' }] },
        spider_intro: {
          id: 'spider_intro', speaker: 'SPIDER', text: 'Тише, неофит. Ядро слушает каждое эхо. "VOID" не прощает болтливости. Мы — призраки в машине ГигаБанка. Зачем пришел? Ищешь правду под слоями шифрования?',
          options: [
            { text: 'Ищу способ взломать Систему.', nextId: 'spider_lore' },
            { text: 'Нужен софт. (50 Bits)', nextId: 'spider_trade', cost: 50, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
            { text: 'Слава Свободным Данным! ( +10 VOID )', nextId: 'spider_loyalty', reputationReward: { factionId: 'ANARCHO_VOID', amount: 10 } },
            { text: '[ Назад ]', nextId: 'intro' }
          ]
        },
        spider_loyalty: { id: 'spider_loyalty', speaker: 'SPIDER', text: 'Наш человек. ГигаБанк считает нас багом, но мы — сама операционная система. Держи зашифрованный ключ, он пригодится в Южных Секторах.', options: [{ text: 'Смерть Корпоратам.', nextId: 'intro' }] },
        spider_lore: { id: 'spider_lore', speaker: 'SPIDER', text: 'В 2024-м Ядро Октября лишилось контроля над Moscow Zero. Теперь они пытаются сшить город нитями "VOSKHOD", но пакеты всё равно теряются. Мы — те самые потерянные пакеты.', options: [{ text: 'Расскажи больше.', nextId: 'spider_intro' }] },
        mira_intro: {
          id: 'mira_intro', speaker: 'MIRA (NK)', text: 'Точность. Честь. Кремний. NeoKyoto не интересует политика ГБ или хаос VOID. Нас интересует эффективность. У тебя в логах — сплошной мусор. Хочешь апгрейд или так и будешь лагать?',
          options: [
            { text: 'Узнать про технологии NK.', nextId: 'mira_lore' },
            { text: 'Купить чип NK (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_XP', amount: 150 },
            { text: '[ Назад ]', nextId: 'intro' }
          ]
        },
        bar_hub: {
          id: 'bar_hub', speaker: 'БАРМЕН', text: 'Коктейль "NullPointerException"? Или сразу "Kernel Panic"? У нас сегодня акция для почетных клиентов ГБ.',
          options: [
            { text: 'Бесплатный напиток [ ТРЕБУЕТ ГБ: 20 ]', nextId: 'bar_free', requireReputation: { factionId: 'GIGA_BANK', minPoints: 20 } },
            { text: 'Купить "Дебаг" (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 30 },
            { text: 'Назад', nextId: 'intro' }
          ]
        },
        bar_free: { id: 'bar_free', speaker: 'БАРМЕН', text: 'О, уважаемый гость. ГБ оплатило ваш счет за "лояльность архитектуре". Пейте на здоровье своего нейростека.', options: [{ text: 'За ГБ!', nextId: 'intro', effect: 'RESTORE_HP', amount: 50 }] }
      }
    },
    npc_deck_ai: {
      id: 'npc_deck_ai', startNodeId: 'boot_0',
      nodes: {
        boot_0: {
          id: 'boot_0', speaker: 'CYBERDECK_OS (AIDA-01)', text: '>>> Инициализация нейроинтерфейса... [OK]\n>>> Проверка биометрии... [OK]\n>>> Добро пожаловать, оператор. Я — твой персональный ассистент AIDA-01. Твоё сознание успешно синхронизировано с московской сетью Октября.',
          options: [ { text: 'Где я?', nextId: 'lore_1' }, { text: 'Кто я по профессии?', nextId: 'career_intro' } ]
        },
        lore_1: {
          id: 'lore_1', speaker: 'AIDA-01', text: 'Ты в Москве. Но не в той, что в учебниках. Здесь мир разрезан надвое. Внизу — технические трущобы, где стажеры вроде тебя грызутся за каждый байт. Наверху, в небесных кабинетах Москва-Сити, сидят Архитекторы и Лиды, управляющие реальностью через золотые терминалы. У тебя нет класса. Ты — чистый лист. Пока что.',
          options: [ { text: 'Какие пути есть в этом мире?', nextId: 'career_intro' } ]
        },
        career_intro: {
          id: 'career_intro', speaker: 'AIDA-01', text: 'В системе Октября существует два типа допусков: Языковые Стэки и Инженерные Роли. Твой стартовый набор скриптов позволит тебе выжить на дне, но для восхождения потребуется полноценный Класс. О какой категории данных ты хочешь узнать?',
          options: [ { text: '[ КАТЕГОРИЯ: ЯЗЫКОВЫЕ СТЭКИ ]', nextId: 'langs_menu' }, { text: '[ КАТЕГОРИЯ: ИНЖЕНЕРНЫЕ РОЛИ ]', nextId: 'roles_menu' }, { text: 'Я готов начать свой путь.', nextId: 'LEAVE' } ]
        },
        langs_menu: {
          id: 'langs_menu', speaker: 'AIDA-01', text: 'Языки программирования определяют твой стиль боя и доступные протоколы. Выбери поток для анализа:',
          options: [ { text: 'Java: Путь Корпората', nextId: 'desc_java' }, { text: 'Python: Спектр Автоматизации', nextId: 'desc_python' }, { text: 'Kotlin: Мобильный Форсаж', nextId: 'desc_kotlin' }, { text: 'Go: Параллельная Реальность', nextId: 'desc_go' }, { text: 'JavaScript: Визуальный Хаос', nextId: 'desc_js' }, { text: '[ Вернуться ]', nextId: 'career_intro' } ]
        },
        roles_menu: {
          id: 'roles_menu', speaker: 'AIDA-01', text: 'Специализации определяют твою роль в иерархии Системы. Это не просто код, это влияние.',
          options: [ { text: 'DevOps: Строитель Путей', nextId: 'desc_devops' }, { text: 'SysAdmin: Хранитель Уровня', nextId: 'desc_admin' }, { text: 'Architect: Визионер Структуры', nextId: 'desc_arch' }, { text: 'Project Manager: Вектор Хаоса', nextId: 'desc_pm' }, { text: 'QA Tester: Инквизитор Багов', nextId: 'desc_qa' }, { text: '[ Вернуться ]', nextId: 'career_intro' } ]
        },
        desc_java: { id: 'desc_java', speaker: 'AIDA-01', text: 'Java Junior: Фундамент старого мира. Твой код — это крепость. Медленно, но надежно. Используется в глубоких слоях банковских систем и государственных базах.', options: [{ text: 'Понятно.', nextId: 'langs_menu' }] },
        desc_python: { id: 'desc_python', speaker: 'AIDA-01', text: 'Python Developer: Скорость мысли превыше всего. Идеально для взлома нейросетей и быстрой автоматизации турелей. Минус в оптимизации, но кого это волнует, когда код уже работает?', options: [{ text: 'Понятно.', nextId: 'langs_menu' }] },
        desc_kotlin: { id: 'desc_kotlin', speaker: 'AIDA-01', text: 'Kotlin Developer: Мастер лаконичности. Твой код чист и современен. Идален для управления мобильными терминалами и носимыми девайсами.', options: [{ text: 'Понятно.', nextId: 'langs_menu' }] },
        desc_go: { id: 'desc_go', speaker: 'AIDA-01', text: 'Go Developer: Король параллелизма. Ты запускаешь сотни потоков одновременно. Твои атаки быстрее, чем реакция защитного ИИ.', options: [{ text: 'Понятно.', nextId: 'langs_menu' }] },
        desc_js: { id: 'desc_js', speaker: 'AIDA-01', text: 'JavaScript Developer: Ты управляешь тем, что видят другие. Визуальный взлом интерфейсов, создание иллюзий и манипуляция реальностью через React-проколы.', options: [{ text: 'Понятно.', nextId: 'langs_menu' }] },
        desc_devops: { id: 'desc_devops', speaker: 'AIDA-01', text: 'DevOps Engineer: Ты не просто пишешь код, ты строишь конвейеры. Автоматизация развертывания вирусов и управление инфраструктурой целых районов.', options: [{ text: 'Понятно.', nextId: 'roles_menu' }] },
        desc_admin: { id: 'desc_admin', speaker: 'AIDA-01', text: 'System Administrator: Ты знаешь все бэкдоры. Прямой доступ к железу, управление питанием и физическая блокировка узлов.', options: [{ text: 'Понятно.', nextId: 'roles_menu' }] },
        desc_arch: { id: 'desc_arch', speaker: 'AIDA-01', text: 'System Architect: Высшая каста. Ты не фиксишь баги, ты создаешь законы, по которым баги невозможны. Самый сложный и дорогой путь к вершине.', options: [{ text: 'Понятно.', nextId: 'roles_menu' }] },
        desc_pm: { id: 'desc_pm', speaker: 'AIDA-01', text: 'Project Manager: Управление ресурсами и чужими жизнями. Твои карты заставляют других работать на тебя. Лидерство — твоё главное оружие.', options: [{ text: 'Понятно.', nextId: 'roles_menu' }] },
        desc_qa: { id: 'desc_qa', speaker: 'AIDA-01', text: 'QA Tester: Ты видишь изъяны в совершенстве. Твои атаки находят слабые места в любой защите, превращая чужую уверенность в NullPointerException.', options: [{ text: 'Понятно.', nextId: 'roles_menu' }] }
      }
    },
  }
};
