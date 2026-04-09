import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_echo_broker_dialogues = new DialogueBuilder('npc_echo_broker').withDistrict('fili')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro'],
    stressed: ['intro'],
    repeat: ['intro', 'intro_v2']
  })
  .addNode('intro', 'ЭХО (МЕДИА-БРОКЕР)', 'Слышь, кодер... Алярм. Спутник перехватил трафик GigaBank про слияние с Нео-Токио. Нужен расшифровщик для "Moscow Echo". Поможешь?', [
    { text: 'Что за GigaBank?', nextId: 'lore_media' },
    { text: 'Взломать шифр (Technical).', nextId: 'branch_tech_1' },
    { text: 'Связи в техподдержке (Social: 100 Bits).', nextId: 'branch_social_1', cost: 100 },
    { text: 'Заберу данные силой (Combat).', nextId: 'branch_combat_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ЭХО (МЕДИА-БРОКЕР)', '*курит цифровую сигарету* Город спит, а мы — нет. Октябрь полон утечек. Ты сегодня охотник или жертва в потоке данных?', [
    { text: 'Расскажи про GigaBank.', nextId: 'lore_media' },
    { text: 'Есть работа.', nextId: 'intro' }
  ])
  .addNode('intro_friendly', 'ЭХО (МЕДИА-БРОКЕР)', 'Мой лучший информатор! Данные о спутниках подняли наш рейтинг выше Останкино. Что нашел сегодня?', [
    { text: 'Давай обсудим новый слив.', nextId: 'intro' }
  ])
  .addLoreNode('lore_media', 'ЭХО (МЕДИА-БРОКЕР)', 'GigaBank скупил все долги Октября. Хотят превратить город в кредитный отдел. Мы — последние, кто пишет правду. (+Intel: GigaBank)', 'intro', 'GigaBank')
  .addNode('branch_tech_1', 'ЭХО (МЕДИА-БРОКЕР)', 'Ключ 4-й категории... Дека должна работать на пределе. Если расшифруешь без шума — мы короли эфира. Рискнешь?', [
    { text: '[ ИНИЦИИРОВАТЬ РАСШИФРОВКУ ]', nextId: 'branch_tech_check', requireMinLevel: 6 },
    { text: 'Это слишком сложно.', nextId: 'intro' }
  ])
  .addNode('branch_tech_check', 'ЭХО (МЕДИА-БРОКЕР)', '[SUCCESS] Да ты гений! Данные текут чистым текстом! GigaBank планирует поглощение. Это бомба! Вот твои Bits.', [
    { text: 'Рад помочь. (Завершить)', nextId: 'LEAVE', completeQuestId: 'q_fili_media_leak' }
  ])
  .addNode('branch_social_1', 'ЭХО (МЕДИА-БРОКЕР)', 'Bits открывают многие порты. Ладно, передам их "источнику". ...Есть! Текст расшифрован. Ты молодец.', [
    { text: 'Чистая работа. (Завершить)', nextId: 'LEAVE', completeQuestId: 'q_fili_media_leak' }
  ])
  .addNode('branch_combat_start', 'ЭХО (МЕДИА-БРОКЕР)', 'Спутник упал в секторе 15, там полно дронов-утилизаторов. Подключайся (ssh), тяни дамп (curl), давай права (chmod) и слушай порт (nc). Принеси черный ящик — напишу о тебе в передовице.', [
    { text: '[ ОТПРАВИТЬСЯ К МЕСТУ ПАДЕНИЯ ]', nextId: 'LEAVE', awardQuestId: 'q_fili_combat_satellite_crash_bug_sweep' }
  ])
  .build();
