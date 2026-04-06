import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_auditor_dialogues = new DialogueBuilder('npc_auditor')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ИНКВИЗИТОР', 'Твой нейростек нестабилен в свете здешних констант. Я провожу аудит Таганского бункера. Какова цель твоей итерации?', [
    { text: 'Кто такие "Инквизиторы"?', nextId: 'lore_faction' },
    { text: 'Ищу правду об "Октябре".', nextId: 'quest_explain_1' },
    { text: 'Я принес логи от Архивариуса из Фили.', nextId: 'quest_audit_finish', requireQuestId: 'q_fili_audit_logs' },
    { text: 'Мне нужен доступ к архивам GigaBank.', nextId: 'quest_bribe_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('quest_audit_finish', 'ИНКВИЗИТОР', 'Логи Фили... *сканирует* Здесь записи о несанкционированном выводе Bits. Это подтверждает мои подозрения. Возьми награду за бдительность.', [
    { text: 'Благодарю, Инквизитор.', nextId: 'intro', completeQuestId: 'q_fili_audit_logs', effect: 'GIVE_BITS', amount: 100 }
  ])
  .addNode('quest_bribe_start', 'ИНКВИЗИТОР', 'Доступ к архивам? Это стоит либо больших Bits, либо услуги. Нужно убедить Совет в Таганке. (Принять контракт)', [
    { text: '[ ПРИНЯТЬ: ПЕРЕГОВОРЫ ]', nextId: 'LEAVE', awardQuestId: 'q_taganka_bribe_negotiation' }
  ])
  .addNode('intro_v2', 'ИНКВИЗИТОР', '*рассматривает перфокарты* Вижу новую переменную. Твой стек обладает сложностью для внешнего юнита. Ты за валидацией или за забвением?', [
    { text: 'За валидацией.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ИНКВИЗИТОР', 'А, доверенная константа. Твой отклик чист, как первичный код Ядра. В Глубоком Аудите аномалии, нужен твой потенциал.', [
    { text: 'Я готов, Инквизитор.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_friendly_v2', 'ИНКВИЗИТОР', 'Мой лучший аналитик. Твои отчеты — это поэзия в бинарном мире. Есть работа посложнее.', [
    { text: 'СЛУШАЮ.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_hostile', 'ИНКВИЗИТОР', '[SCAN_ERROR] Твой код — ходячее исключение. Ты нарушаешь законы бункера. Уходи, пока я не обнулил твою константу.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'ИНКВИЗИТОР', 'Твои сигналы... они дребезжат. Ты слишком долго был на поверхности. Сходи в "Холодный Буфер", приведи логи в порядок.', [
    { text: 'Понял.', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'ИНКВИЗИТОР', 'Снова за Глубоким Аудитом? Уровни не стали проще. Готов к новой итерации?', [
    { text: 'Готов.', nextId: 'quest_explain_1' }
  ])
  .addLoreNode('lore_faction', 'ИНКВИЗИТОР', 'Мы — хранители чистоты. Мы блюдем не закон, а смысл. Мы следим, чтобы код Москвы не стал хаосом ради Bits. (+Intel: Инквизиторы)', 'intro', 'Inquisitors')
  .addNode('quest_explain_1', 'ИНКВИЗИТОР', 'Правда — привилегия прошедших аудит. Чтобы добраться до логов "Октября", ты должен спуститься в Глубокий Аудит. Как будешь действовать?', [
    { text: 'Прямой бой (Standard).', nextId: 'quest_explain_2' },
    { text: 'Logical Mirror (Technical).', nextId: 'quest_tech_path', requireMinLevel: 8 },
    { text: 'Допуск Аудитора (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'FEDERAL_OVERSIGHT', minPoints: 50 } }
  ])
  .addNode('quest_explain_2', 'ИНКВИЗИТОР', 'Охранные боты — константы защиты. Быстры и холодны. Если стек не выдержит — от тебя не останется и бита. Готов?', [
    { text: 'Я готов. Проверяй.', nextId: 'rank_check' },
    { text: 'Надо подготовиться.', nextId: 'intro' }
  ])
  .addNode('quest_tech_path', 'ИНКВИЗИТОР', 'Отразить их логику? Рискованно. Если прерывание чище их алгоритма — боты "сотрутся". Но это нагрузка на CPU. Справишься?', [
    { text: 'Справлюсь. Сканируй.', nextId: 'rank_check' }
  ])
  .addNode('quest_social_path', 'ИНКВИЗИТОР', 'Репутация в Federal Oversight дает админ-доступ. Боты примут тебя за Лид-инспектора. Готов?', [
    { text: 'Да. Проверяй сигнатуру.', nextId: 'rank_check' }
  ])
  .addNode('rank_check', 'ИНКВИЗИТОР', 'Запускаю процедуру глубокого сканирования... (Воздух холодеет, пока он входит в твой поток данных...)', [
    { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 7, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 8 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ИНКВИЗИТОР', 'Ложный результат. Твой уровень за гранью валидности Таганки. Нос не дорос до наших тайн! Покинь бункер.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ИНКВИЗИТОР', 'Валидация пройдена. Твоя константа впечатляет. Контракт твой. Спустись в Глубокий Аудит и принеси истину.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ: ГЛУБОКИЙ АУДИТ ]', nextId: 'LEAVE', awardQuestId: 'q_taganka_combat_deep_audit_bug_sweep' }
  ])
  .build();
