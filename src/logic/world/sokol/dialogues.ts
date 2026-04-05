import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder, createServiceNpc } from '../../dialogueUtils';

export const sokol_dialogues: Record<string, DialogueTree> = {
  // --- DEAN ---
  npc_dean: new DialogueBuilder('npc_dean')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2', 'intro_friendly_v3'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ДЕКАН_КОЛЛЕДЖА', 'Нужна работа, стажер? В EU Syntax требуются практики... Что выбираешь?', [
      { text: 'Процедура аккредитации (Профессия)', nextId: 'accreditation_pitch' },
      { text: 'Кто такие EU Syntax?', nextId: 'lore_faction' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ДЕКАН_КОЛЛЕДЖА', '*рассматривает телеметрию* Еще один абитуриент... Хочешь привести свой стек в порядок?', [
      { text: 'Я готов к сертификации.', nextId: 'accreditation_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'ДЕКАН_КОЛЛЕДЖА', 'Авиация Москвы не прощает небрежности в типизации данных... Ты понимаешь ответственность?', [
      { text: 'Понимаю.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v4', 'ДЕКАН_КОЛЛЕДЖА', '...Твой ID... хм, довольно свежий. Хочешь поднять свой уровень допуска?', [
      { text: 'Давайте попробуем.', nextId: 'accreditation_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ДЕКАН_КОЛЛЕДЖА', 'А, сертифицированный специалист! Рад видеть чистые логи EU Syntax. Нужен продвинутый курс?', [
      { text: 'Покажите программы.', nextId: 'accreditation_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'ДЕКАН_КОЛЛЕДЖА', 'Ваша сигнатура — пример для подражания... Продолжим обучение или всё ещё отдыхаешь?', [
      { text: 'Продолжим.', nextId: 'accreditation_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v3', 'ДЕКАН_КОЛЛЕДЖА', 'Дорогой коллега! Вижу, ваш стек расширился... Сначала проверьте свои сертификаты.', [
      { text: 'Проверим.', nextId: 'accreditation_pitch' }
    ])
    .addNode('intro_hostile', 'ДЕКАН_КОЛЛЕДЖА', '[SCAN_ERROR] Твоя сигнатура полна деструктивных паттернов... Проваливай из Сокола.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile_v2', 'ДЕКАН_КОЛЛЕДЖА', 'Внимание на правый фланг. Обнаружен юнит-вредитель... Проваливай.', [
      { text: 'Ладно.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'ДЕКАН_КОЛЛЕДЖА', 'У вас критический уровень системного шума... Отдохните в "Пропеллере".', [
      { text: 'Я справлюсь.', nextId: 'intro' }
    ])
    .addNode('intro_stressed_v2', 'ДЕКАН_КОЛЛЕДЖА', 'Ваш джиттер зашкаливает... Немедленно покиньте зону аттестации.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ДЕКАН_КОЛЛЕДЖА', 'Снова за лицензией? Помните: в небе нет места для "авось".', [
      { text: 'Я помню правило.', nextId: 'accreditation_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v2', 'ДЕКАН_КОЛЛЕДЖА', 'Цикл обучения бесконечен... Желаете обновить свои системные допуски?', [
      { text: 'Обновить.', nextId: 'accreditation_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('accreditation_pitch', 'ДЕКАН_КОЛЛЕДЖА', 'Выбирай свой путь с полной ответственностью... Что ты планируешь администрировать?', [
      { text: 'Запросить: Профессия "Системный Администратор" (200 Bits)', nextId: 'ok', cost: 200, effect: 'SET_PROFESSION', cardRewardId: 'sysadmin_jun' },
      { text: 'Запросить: Профессия "QA Тестировщик" (180 Bits)', nextId: 'ok', cost: 180, effect: 'SET_PROFESSION', cardRewardId: 'qa_heavy_jun' },
      { text: 'Я еще не определился.', nextId: 'intro' }
    ])
    .addLoreNode('lore_faction', 'ДЕКАН_КОЛЛЕДЖА', 'EU Syntax — это архитекторы точности. Мы курируем критические системы города...', 'intro', 'EU Syntax')
    .addNode('ok', 'ДЕКАН_КОЛЛЕДЖА', 'Корочка готова. Теперь ты в системе официально. Работай честно. Удачи, техник.', [
      { text: 'Спасибо.', nextId: 'LEAVE' }
    ])
    .build(),

  // --- SEMENYCH ---
  npc_retired_tester: new DialogueBuilder('npc_retired_tester')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'СЕМЕНЫЧ', 'Баги в авионике — это не шутки, сынок... Хочешь почувствовать, как дрожали прерывания?', [
      { text: 'Я готов к испытанию.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'СЕМЕНЫЧ', '*чистит контакты* Эх, молодежь... Хочешь проверить свой стек на прочность?', [
      { text: 'Хочу.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'СЕМЕНЫЧ', 'Слышишь гул моторов? Дроны Сокола... Хочешь помочь очистить их репозитории?', [
      { text: 'Я готов.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v4', 'СЕМЕНЫЧ', 'В моё время за одну утечку памяти... Хочешь приобщиться к синтаксису?', [
      { text: 'В чем суть работы?', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'СЕМЕНЫЧ', 'О, надежный юнит! Помнишь рой? Рискнешь своим железом ради старика?', [
      { text: 'Рискну.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'СЕМЕНЫЧ', 'Твой код лаконичен и смертоносен. Пойдешь на дефрагментацию серверной?', [
      { text: 'Веди.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'СЕМЕНЫЧ', 'Парень, у тебя CPU визжит... Сходи в "Пропеллер", промой соты.', [
      { text: 'Ладно.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed_v2', 'СЕМЕНЫЧ', 'У тебя джиттер такой, что ты сейчас коротнёшь... Проваливай к Оллегу или в бар.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'СЕМЕНЫЧ', 'Снова за острыми байтами? Рой не дремлет. Готов лезть в пекло?', [
      { text: 'Готов, Семёныч.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v2', 'СЕМЕНЫЧ', 'Рекурсия — штука опасная. Опять в бой против багов и роев?', [
      { text: 'План прост.', nextId: 'quest_explain_1' }
    ])
    .addNode('quest_explain_1', 'СЕМЕНЫЧ', 'Либо "Соколы" взбесились, либо серверная кипит. Как будешь решать проблему?', [
      { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
      { text: 'Перекалибровка шлюза. (Technical)', nextId: 'quest_tech_path', requireMinLevel: 3 },
      { text: 'Связи в EU Syntax. (Social)', nextId: 'quest_social_path', requireReputation: { factionId: 'EU_SYNTAX', minPoints: 15 } }
    ])
    .addNode('quest_explain_2', 'СЕМЕНЫЧ', 'Это не для слабаков — один лаг, и ты уголёк. Уверен в своем стеке?', [
      { text: 'Мой стек стабилен. Проверяй.', nextId: 'rank_check' },
      { text: 'Мне нужно еще время.', nextId: 'intro' }
    ])
    .addNode('quest_tech_path', 'СЕМЕНЫЧ', 'Перехватить управление? Смело. Берешься?', [
      { text: 'Берусь.', nextId: 'rank_check' }
    ])
    .addNode('quest_social_path', 'СЕМЕНЫЧ', 'Рекомендация Декана — это сила... Готов?', [
      { text: 'Готов. Проверяй.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'СЕМЕНЫЧ', 'Ну-ка, дай гляну твою страховку... *щурится*', [
      { text: '[ Ждать вердикта ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать вердикта ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'СЕМЕНЫЧ', 'Эх, малец... Что-то твой стек фонит. Наберись опыта и приходи.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'СЕМЕНЫЧ', 'Неплохо. Вижу руку мастера. Хорошо, контракт твой.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: РОЙ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokol_combat_drone_swarm_bug_sweep' },
      { text: '[ ПРИНЯТЬ КОНТРАКТ: СЕРВЕРНАЯ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokol_combat_server_overheat_bug_sweep' }
    ])
    .build(),

  // --- PROPELLER BAR ---
  bar_propeller: new DialogueBuilder('bar_propeller')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      repeat: ['intro', 'intro_repeat']
    })
    .addNode('intro', 'КАБАК_ПРОПЕЛЛЕР', 'Здесь пахнет керосином и спиртом... Чем зальете форсунки?', [
      { text: 'Чашка "Взлета" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 35, subtext: 'Исцеление 35 HP.' },
      { text: 'Полная промывка форсунок (55 Bits)', nextId: 'intro', cost: 55, effect: 'RESTORE_HP', amount: 100, subtext: 'Максимальное исцеление.' },
      { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'КАБАК_ПРОПЕЛЛЕР', 'Воздух густой от озона... Механики молча потягивают коктейли. Присоединитесь?', [
      { text: 'Заказать выпивку.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'КАБАК_ПРОПЕЛЛЕР', 'Над Соколом кружат дроны... Желаете смыть системный стресс?', [
      { text: 'Смыть стресс.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'КАБАК_ПРОПЕЛЛЕР', 'Снова в зоне обслуживания. Форсунки всё ещё con нагаром?', [
      { text: 'Наливай.', nextId: 'intro' }
    ])
    .build(),

  // --- LAB ASSISTANT ---
  npc_lab_assistant: new DialogueBuilder('npc_lab_assistant')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ЛАБОРАНТ ИЛЬЯ', 'Осторожно! Не наступай на оптовлокно... Ты абитуриент или аноним?', [
      { text: 'Я ищу практику.', nextId: 'quest_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ЛАБОРАНТ ИЛЬЯ', '*копается в щите* Опять скачок... Хочешь помочь с инвентаризацией?', [
      { text: 'Помогу.', nextId: 'quest_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ЛАБОРАНТ ИЛЬЯ', 'А, лучший практикант семестра! Есть одна "горячая" задачка.', [
      { text: 'Я готов.', nextId: 'quest_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ЛАБОРАНТ ИЛЬЯ', 'Снова в лаборатории? Рекурсия — это хорошо. Готов к тестам?', [
      { text: 'Готов.', nextId: 'quest_start' }
    ])
    .addNode('quest_start', 'ЛАБОРАНТ ИЛЬЯ', 'Нужно доставить "Методички по Ассемблеру" Профессору Архипову в Академию (Юго-Западный округ). Справишься, "Стажер"?', [
      { text: '[ ПРИНЯТЬ: ДОСТАВКА МЕТОДИЧЕК ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokol_talk_lab_delivery' },
      { text: 'Мне некогда.', nextId: 'intro' }
    ])
    .build(),

  // --- DRONE PILOT ---
  npc_drone_pilot: new DialogueBuilder('npc_drone_pilot')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ПИЛОТ ДРОНОВ', '*проверяет линзы* Воздух Сокола чист... Хочешь поуправлять облаком из ста ботов?', [
      { text: 'Хочу пройти обучение.', nextId: 'quest_combat_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ПИЛОТ ДРОНОВ', 'Тебе нужно больше высоты в коде... устрим тренировочный полет?', [
      { text: 'Я не боюсь.', nextId: 'quest_combat_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ПИЛОТ ДРОНОВ', 'Снова на взлетной полосе? Готов к калибровке роя?', [
      { text: 'Взлетаем.', nextId: 'quest_combat_start' }
    ])
    .addNode('quest_combat_start', 'ПИЛОТ ДРОНОВ', 'Это будет "легкий" PING-тест... продержись три цикла. Погнали?', [
      { text: '[ ПРИНЯТЬ: ТРЕНИРОВКА РОЯ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokol_combat_drone_training' },
      { text: 'Позже.', nextId: 'intro' }
    ])
    .build(),

  // --- AVIONICS DEV ---
  npc_avionics_dev: new DialogueBuilder('npc_avionics_dev')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'АВИОНИК-РАЗРАБОТЧИК', 'Весь этот мир держится на прерываниях... Почему дроны не падают?', [
      { text: 'Расскажи про системы.', nextId: 'lore_talk' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'АВИОНИК-РАЗРАБОТЧИК', '*кодит* Опять утечка... У тебя в руках дека или калькулятор?', [
      { text: 'Чем помочь?', nextId: 'quest_fetch_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'АВИОНИК-РАЗРАБОТЧИК', 'Ищешь истину в ассемблере? Ну заходи, прошивка "вскипает".', [
      { text: 'Есть работа?', nextId: 'quest_fetch_start' }
    ])
    .addLoreNode('lore_talk', 'АВИОНИК-РАЗРАБОТЧИК', 'Авионика — это религия EU Syntax. Мы верим в Чистый Взлет...', 'intro', 'Авионика')
    .addNode('quest_fetch_start', 'АВИОНИК-РАЗРАБОТЧИК', 'Мне нужен старый чип "Стриж-4". У Семёныча должен быть ящик. Принесешь?', [
      { text: '[ ПРИНЯТЬ: ПОИСК ЧИПА ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokol_fetch_chip_quest' },
      { text: 'Я занят.', nextId: 'intro' }
    ])
    .build(),
};
