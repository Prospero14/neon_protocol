import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_grey_dialogues = new DialogueBuilder('npc_grey')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2', 'intro_friendly_v3'],
    hostile: ['intro_hostile', 'intro_hostile_v2'],
    stressed: ['intro_stressed', 'intro_stressed_v2'],
    repeat: ['intro_repeat', 'intro_repeat_v2', 'intro_repeat_v3']
  })
  .addNode('intro', 'ГРЕЙ', 'Тс-с... Тебя не засекли? Выхино сейчас кишит аудиторами... Я Грей, из Redundants. Что ищем?', [
    { text: 'Кто такие Redundants?', nextId: 'lore_faction' },
    { text: 'Что сейчас слышно в Выхино?', nextId: 'lore_district' },
    { text: 'Ищу работу.', nextId: 'quest_pitch' },
    { text: 'Я почистил логи в терминале.', nextId: 'quest_audit_finish', requireQuestId: 'q_vykhino_audit_evasion' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ГРЕЙ', '*копается в щите* Еще один гость... Твой стек выглядит слишком опрятно. Ты из тех, кто пишет документацию?', [
    { text: 'Нарушение — мой профиль.', nextId: 'intro' },
    { text: 'Ищу работу.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'ГРЕЙ', 'Выхино — это перекресток всех битых байтов... Тебе некуда податься или ищешь стертое Октябрем?', [
    { text: 'Что-то вроде того.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ГРЕЙ', 'А, наш человек. Вижу чистую сигнатуру. Есть "фонящий" пакет на перегоне. Поможешь?', [
    { text: 'Я в деле.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'ГРЕЙ', 'Твои логи — загляденье. Чистое плетение Redundants. Есть дельце и здесь, только для своих.', [
    { text: 'Выкладывай, Грей.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v3', 'ГРЕЙ', 'Твой последний перехват спас базу данных... Для тебя у меня всегда есть "тихий" канал.', [
     { text: 'Ценю это.', nextId: 'intro' },
     { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_hostile', 'ГРЕЙ', 'Твой код светится в логах Federal Oversight... Исчезни, пока я не слил твои координаты.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_hostile_v2', 'ГРЕЙ', '[SCAN_ALARM] Корпоративная прошивка. Проваливай, пока я не активировал ЭМИ-ловушку.', [
     { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'ГРЕЙ', 'Ты дрожишь, парень. Помехи на весь хаб. Остынь в "Транзите", выпей "Выдоха".', [
    { text: 'Бипы-бупы слышу...', nextId: 'intro' }
  ])
  .addNode('intro_stressed_v2', 'ГРЕЙ', 'У тебя джиттер в глазах! Как живой маяк слежения. Сядь, дефрагментируйся.', [
     { text: 'Понял.', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'ГРЕЙ', 'Снова перехват груза? Патрули плодятся быстро. Готов к новой вылазке?', [
    { text: 'Да, Грей. Давай данные.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat_v2', 'ГРЕЙ', '*проверяет пинг* Твои возвращения всегда сулят Bits. Продолжим зачистку?', [
    { text: 'Готов.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat_v3', 'ГРЕЙ', 'Время — это Bits. Не стой на линии. Если ищешь работу — она всё та же.', [
     { text: 'К делу.', nextId: 'intro' },
     { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore_faction', 'ГРЕЙ', 'Мы — заноза в их корпоративной заднице. Gigabank хочет контроля, а мы храним хаос.', 'intro', 'Redundants')
  .addLoreNode('lore_district', 'ГРЕЙ', 'Выхино — перекресток всех битых байтов. Здесь транзит, здесь рынок, здесь... смерть для неосторожных пакетов.', 'intro')
  .addNode('quest_pitch', 'ГРЕЙ', 'Работа всегда есть. На перегоне застрял контейнер, или нужно зачистить логи в терминале. Что выберешь?', [
    { text: 'Зачистить логи аудита (60 Bits).', nextId: 'quest_audit_accept' },
    { text: 'Перехватить контейнер (Combat).', nextId: 'quest_explain_1' },
    { text: 'Назад.', nextId: 'intro' }
  ])
  .addNode('quest_explain_1', 'ГРЕЙ', 'На перегоне застрял контейнер с данными. Охрана — дроны Ядра. Как будешь работать?', [
    { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
    { text: 'Допуск Net Drivers. (Social)', nextId: 'quest_social_gate', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 20 } },
    { text: 'Взлом через метро-шлюз. (Technical)', nextId: 'quest_tech_gate', requireMinLevel: 3 }
  ])
  .addNode('quest_explain_2', 'ГРЕЙ', 'У них софт на старом "sudo-стеке". Пробить сложно. Рискнешь?', [
    { text: 'Проверяй маску.', nextId: 'rank_check' },
    { text: 'Позже.', nextId: 'intro' }
  ])
  .addNode('quest_social_gate', 'ГРЕЙ', 'Net Drivers умеют договариваться. Дроны просто "уснут". Берешься?', [
    { text: 'Давай ключ.', nextId: 'quest_accept' }
  ])
  .addNode('quest_tech_gate', 'ГРЕЙ', 'Нашел уязвимость в 404-м порту? Красиво. Если перехватишь управление — бой не нужен.', [
    { text: 'Дека вытянет. Принимаю.', nextId: 'quest_accept' }
  ])
  .addNode('rank_check', 'ГРЕЙ', 'Дай гляну твою сигнатуру... (Сканирование Грей-кодом...)', [
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ГРЕЙ', 'Ха! Пыль от учебников Академии еще не осела. Нос не дорос. Вернись позже.', [
    { text: 'Я еще покажу тебе...', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ГРЕЙ', 'Неплохо. У тебя чистые прерывания. Хорошо, контракт твой. Удачи.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_vykhino_combat_cargo_bug_sweep' }
  ])
  .addNode('quest_audit_accept', 'ГРЕЙ', 'Стери логи в Центральном Терминале за последние 24 часа. Плачу 60 Bits. Помни: найди логи (ls), отфильтруй записи за сутки (grep) и "отстирай" их (wash_logs). Рискнешь?', [
    { text: 'Я сделаю это.', nextId: 'LEAVE', awardQuestId: 'q_vykhino_audit_evasion' },
    { text: 'Слишком опасно.', nextId: 'intro' }
  ])
  .addNode('quest_audit_finish', 'ГРЕЙ', 'Проверил... Чисто. Красивая работа. Вот твои 60 Bits. Плюс — уважение Redundants.', [
     { text: 'Был рад помочь.', nextId: 'intro', effect: 'GIVE_BITS', amount: 60, completeQuestId: 'q_vykhino_audit_evasion' }
  ])
  .build();
