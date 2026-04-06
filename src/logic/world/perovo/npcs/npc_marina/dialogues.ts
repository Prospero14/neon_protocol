import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_marina_dialogues = new DialogueBuilder('npc_marina')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'МАРИНА', 'Тише... Логи не любят шума. Я Marina, храню то, что другие выбросили. Мы в Net Drivers верим: в мусоре есть истина. Зачем тревожишь архивы?', [
    { text: 'Кто такие Net Drivers?', nextId: 'lore_faction' },
    { text: 'Нужна работа по поиску данных.', nextId: 'quest_explain_1' },
    { text: 'Очистка логов.', nextId: 'quest_log_clean_accept' },
    { text: 'Таблица разделов отсортирована.', nextId: 'quest_log_clean_finish', requireQuestId: 'q_perovo_marina_log_clean' },
    { text: 'Ищу старые записи района.', nextId: 'lore_marina' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'МАРИНА', '*продувает пыль* Еще один юнит. В Перово не доверяем новым паттернам, только проверенным дампам. Ты за историей или за Bits?', [
    { text: 'За Bits.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'МАРИНА', 'А, ценитель архивов. Твой прошлый вклад был безупречен. Есть деликатная задача в 14-м секторе.', [
    { text: 'Слушаю, Марина.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_friendly_v2', 'МАРИНА', 'Мой лучший поисковик. Твое умение находить иглу в стоге битого кода — легендарно. Есть работа, которая под силу только тебе.', [
    { text: 'Я готов, Марина.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_hostile', 'МАРИНА', '[ERROR] Сигнатуры конфликтуют. Слишком часто светишься у Регуляторов. Уходи, пока я не стерла твой маршрут.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'МАРИНА', 'Твои пакеты дрожат. Слишком много помех в канале. Остынь, прежде чем лезть в архивы, иначе сожжешь нам все логи.', [
    { text: 'Я в норме. Что там с работой?', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_repeat', 'МАРИНА', 'Снова здесь? Архивы никогда не спят. Процесс-майнеры всё еще пытаются прогрызть наши файрволы. Поможешь?', [
    { text: 'Помогу.', nextId: 'quest_explain_1' }
  ])
  .addLoreNode('lore_faction', 'МАРИНА', 'Мы — память Москвы. Сохраняем то, что сделало город живым. Держим маршруты открытыми, даже когда МКАД перекрыт. (+Intel: Net Drivers)', 'intro', 'Net Drivers')
  .addLoreNode('lore_marina', 'МАРИНА', 'Перово — свалка данных. Но в мусоре сокровища, которые Корпорации выбросили как опасные. Я собираю историю.', 'intro')
  .addNode('quest_explain_1', 'МАРИНА', 'В подвале завелся процесс-майнер. Он "ест" записи для добычи Bits. Если не остановить — потеряем данные о шлюзах. Как работаем?', [
    { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
    { text: 'Перегрузить память (Technical).', nextId: 'quest_tech_path', requireMinLevel: 3 },
    { text: 'Связи Net Drivers (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 15 } }
  ])
  .addNode('quest_explain_2', 'МАРИНА', 'Это боевой скрипт "Октября". Бьет по портам, выкачивая энергию. Риск обнуления — 45%. Берешься?', [
    { text: 'Проверяй маску.', nextId: 'rank_check' },
    { text: 'Я передумала.', nextId: 'intro' }
  ])
  .addNode('quest_tech_path', 'МАРИНА', 'Использовать "Log Jammer"? Умно. Забить кэш мусором — и он сотрет сам себя. Но нужно быстрое соединение.', [
    { text: 'Справлюсь. Сканируй.', nextId: 'rank_check' }
  ])
  .addNode('quest_social_path', 'МАРИНА', 'Как представитель гильдии, отправь сервисный запрос. Майнер примет тебя за Лида. Готов?', [
    { text: 'Да. Проверяй историю.', nextId: 'rank_check' }
  ])
  .addNode('rank_check', 'МАРИНА', 'Дай гляну историю прерываний... (Пролистывает логи со скоростью света...)', [
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'МАРИНА', 'Дружок, в логах сплошные "Hello World". Нос не дорос до борьбы с боевыми майнерами. Набери опыта.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'МАРИНА', 'След плотный. Сигнатура специалиста. Дом №14 ждет. Прерви процесс любой ценой. (Принять контракт)', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_perovo_combat_data_mining_bug_sweep' }
  ])
  .addNode('quest_log_clean_accept', 'МАРИНА', 'Терабайты мусора с южных шлюзов. Пометь битые сектора. Оплата 30 Bits. Берешься?', [
    { text: 'Сделаю.', nextId: 'LEAVE', awardQuestId: 'q_perovo_marina_log_clean' },
    { text: 'Позже.', nextId: 'intro' }
  ])
  .addNode('quest_log_clean_finish', 'МАРИНА', 'База дышит легче. Вот твои гроши.', [
    { text: 'Спасибо.', nextId: 'intro', effect: 'GIVE_BITS', amount: 30, completeQuestId: 'q_perovo_marina_log_clean' }
  ])
  .build();
