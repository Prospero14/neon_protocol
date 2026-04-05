import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const fili_dialogues: Record<string, DialogueTree> = {
  // --- KOSMOS (ORBITAL ENTHUSIAST) ---
  npc_kosmos: new DialogueBuilder('npc_kosmos')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      hostile: ['intro'],
      stressed: ['intro'],
      repeat: ['intro', 'intro_v2']
    })
    .addNode('intro', 'КОСМОС', 'Эй, земной! Видел, как горят серверные стойки в Фили? Я собираю экспедицию на орбиту... цифровой реальности. Поможешь?', [
      { text: 'Больные фантазии?', nextId: 'lore' },
      { text: 'Нужна работа.', nextId: 'quest_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'КОСМОС', '*смотрит в пустое небо* Видишь эти пиксели? Это битые сектора Ядра. Мы должны подняться выше. У тебя есть допуск к аплинку?', [
      { text: 'Кто ты такой?', nextId: 'lore' },
      { text: 'Я за работой.', nextId: 'quest_pitch' }
    ])
    .addNode('intro_friendly', 'КОСМОС', 'Астро-брат! Твоя сигнатура светится как сверхновая. Готов к очередному затяжному прыжку в код?', [
      { text: 'Готов, Космос.', nextId: 'quest_pitch' }
    ])
    .addLoreNode('lore', 'КОСМОС', 'Это не фантазии. Мы — в симуляции. Единственный выход — через черный ход в облако Ядра. Ты же не хочешь всю жизнь дебажить ошибки в Малом Сити?', 'intro')
    .addNode('quest_pitch', 'КОСМОС', 'Нужны топливные стержни... Сходи к Пусковой Стойке. У стражей там суровые скрипты защиты. Твоя дека выдержит прозвон?', [
      { text: 'Я готов к запуску. Проверяй.', nextId: 'rank_check' },
      { text: 'Не сейчас.', nextId: 'intro' }
    ])
    .addNode('rank_check', 'КОСМОС', 'Дай гляну сигнатуру... (Быстро пролистывает твои боевые логи...)', [
      { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 5, isTraineeOnly: true },
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 6 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'КОСМОС', 'Ха-ха! Да ты еще стажёр. Код развалится при первой же перегрузке. Нос не дорос до орбиты! Возвращайся на 6-м уровне.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'КОСМОС', 'Впечатляет. У тебя есть потенциал. Контракт твой. Сходи к стойке и принеси мне стержни. (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: АПЛИНК ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_fili_combat_launch_guard_bug_sweep' }
    ])
    .build(),

  // --- ECHO (MEDIA BROKER) ---
  npc_echo_broker: new DialogueBuilder('npc_echo_broker')
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
      { text: 'Рад помочь. (Завершить)', nextId: 'LEAVE', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_fili_media_leak' }
    ])
    .addNode('branch_social_1', 'ЭХО (МЕДИА-БРОКЕР)', 'Bits открывают многие порты. Ладно, передам их "источнику". ...Есть! Текст расшифрован. Ты молодец.', [
      { text: 'Чистая работа. (Завершить)', nextId: 'LEAVE', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_fili_media_leak' }
    ])
    .addNode('branch_combat_start', 'ЭХО (МЕДИА-БРОКЕР)', 'Спутник упал в секторе 15, там полно дронов-утилизаторов. Принеси черный ящик — напишу о тебе в передовице.', [
      { text: '[ ОТПРАВИТЬСЯ К МЕСТУ ПАДЕНИЯ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_fili_combat_satellite_crash_bug_sweep' }
    ])
    .build(),

  // --- LUNA (ORBIT STALKER) ---
  npc_orbit_stalker: new DialogueBuilder('npc_orbit_stalker')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ЛУНА', 'Слышишь этот шепот? Это старые спутники Telecon. Они падают, но их логи всё ещё в эфире. Поможешь перехватить поток?', [
      { text: 'Как это сделать?', nextId: 'quest_explain' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_explain', 'ЛУНА', 'Нужно релейное оборудование. Дядя Ваня в Митино — единственный, кто может его собрать. Сходишь?', [
      { text: 'Я помогу.', nextId: 'quest_accept' },
      { text: 'Мне это не интересно.', nextId: 'intro' }
    ])
    .addNode('quest_accept', 'ЛУНА', 'Отлично. Скажи ему, что Луна ждет сигнал. Награда тебя не разочарует.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_fili_satellite_interception' }
    ])
    .build(),

  // --- ARCHIVIST ---
  npc_archivist: new DialogueBuilder('npc_archivist')
    .withGreetings({
      neutral: ['intro'],
      friendly: ['intro_friendly'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'АРХИВАРИУС', 'Каждый байт имеет значение... Я нашел аномалию в логах Фили. Это похоже на тени GigaBank. Нужно передать их Аудитору в Таганку.', [
      { text: 'Что в логах?', nextId: 'lore' },
      { text: 'Я доставлю логи.', nextId: 'quest_accept' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'АРХИВАРИУС', 'Там записи о транзакциях, которых не должно быть. Кто-то вымывает Bits из района. (+Intel: GigaBank Shadows)', 'intro')
    .addNode('quest_accept', 'АРХИВАРИУС', 'Будь осторожен. Аудитор в Таганке — человек непростой. Но он знает, как читать между строк.', [
      { text: '[ ПРИНЯТЬ: ДОСТАВКА ЛОГОВ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_fili_audit_logs' }
    ])
    .build(),
};
