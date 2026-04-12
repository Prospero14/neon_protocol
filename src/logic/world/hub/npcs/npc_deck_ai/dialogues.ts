import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_deck_ai_dialogues = new DialogueBuilder('npc_deck_ai', 'boot_0').withDistrict('kitay_gorod')
  .addNode('boot_0', 'AIDA-01', '>>> Инициализация... биометрия [OK]\n>>> РЕГИСТРАЦИЯ: ОПЕРАТОР_0. Я — ассистент AIDA-01. Твоё сознание синхронизировано с сетью Октября. Каков запрос?', [
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
    { text: 'Developer: Поставка кода', nextId: 'desc_coop_dev' },
    { text: 'QA: Инквизитор багов', nextId: 'desc_qa' },
    { text: 'Admin: Периметр и инфра', nextId: 'desc_coop_admin' },
    { text: 'PM: Ритм команды', nextId: 'desc_pm' },
    { text: 'Architect: Визионер структуры', nextId: 'desc_arch' },
    { text: '[ Вернуться ]', nextId: 'career_intro' }
  ])
  // --- Language descriptions ---
  .addNode('desc_java', 'AIDA-01', 'Java Junior: Фундамент старого мира. Твой код — крепость. Надежно. Используется в глубоких слоях GigaBank.', [{ text: 'Понятно.', nextId: 'langs_menu' }])
  .addNode('desc_python', 'AIDA-01', 'Python Developer: Скорость мысли. Идеально для взлома нейросетей. Игнорируй оптимизацию, если код уже взломал шлюз.', [{ text: 'Понятно.', nextId: 'langs_menu' }])
  .addNode('desc_kotlin', 'AIDA-01', 'Kotlin: Мобильный Форсаж. Компактный, быстрый, совместимый с Java-стеком GigaBank. Предпочтение мобильных операторов и дронных сетей Митино. Высокий потенциал против крупных корпоративных узлов.', [{ text: 'Ясно.', nextId: 'langs_menu' }])
  .addNode('desc_go', 'AIDA-01', 'Go: Параллельная Реальность. Горутины — это параллельные потоки атаки. Максимальная производительность на многоядерных серверах Перово. Идеален для распределённых атак на несколько портов одновременно.', [{ text: 'Принято.', nextId: 'langs_menu' }])
  .addNode('desc_js', 'AIDA-01', 'JavaScript: Визуальный Хаос. Убийца интерфейсов. Работает везде и уязвим везде. В сети Октября используется нелегально — от взлома рекламных щитов до захвата браузерных нейроинтерфейсов граждан.', [{ text: 'Опасно.', nextId: 'langs_menu' }])
  // --- Role descriptions (кооп: четыре роли + архитектор как вершина пути) ---
  .addNode('desc_coop_dev', 'AIDA-01', 'Developer: логика и код на шине — как kata, но ведущие к фиче. Оппонент давит ревью и темпом THREAT.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
  .addNode('desc_coop_admin', 'AIDA-01', 'Admin: сертификаты, балансировка, прокси, фаерволы, карантин. Ты держишь периметр; ИИ бьёт по контуру и стрессу.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
  .addNode('desc_arch', 'AIDA-01', 'System Architect: Высшая каста. Ты не фиксишь баги, ты создаешь законы. Самый сложный путь к вершине.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
  .addNode('desc_pm', 'AIDA-01', 'Project Manager: Управление ресурсами. Твои карты заставляют других работать на тебя. Лидерство — твоё оружие.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
  .addNode('desc_qa', 'AIDA-01', 'QA Tester: Ты видишь изъяны. Твои атаки находят слабые места, превращая чужую уверенность в ошибку.', [{ text: 'Понятно.', nextId: 'roles_menu' }])
  .build();
