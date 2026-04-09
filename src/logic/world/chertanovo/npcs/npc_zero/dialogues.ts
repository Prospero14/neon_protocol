import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_zero_dialogue: DialogueTree = new DialogueBuilder('npc_zero').withDistrict('chertanovo')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'Z3R0', 'Твое существование — это NullPointerException... Мы в "Глючном Гетто" празднуем каждый сбой. Пришел присоединиться к хаосу или ты просто заблудший юзер?', [
    { text: 'Меня прислал Глюк. [ ПОКАЗАТЬ МЕТКУ ]', nextId: 'intro_found', requireQuestId: 'q_chertanovo_find_zero' },
    { text: 'Кто такие "Nullpointers"?', nextId: 'lore_faction' },
    { text: 'Хочу проверить свои силы в бою.', nextId: 'quest_explain_1' },
    { text: 'Мне нужен "Анархический Манифест".', nextId: 'quest_talk' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'Z3R0', '*рисует глейтч-граффити* Новая переменная в системе... Хочешь почувствовать, как биты ломаются под пальцами? Чертаново — это место, где константы становятся переменными.', [
    { text: 'Я готов к дестабилизации.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'Z3R0', 'Чертаново не прощает стабильности. Если твой FPS больше 60 — ты шпион GigaBank. У тебя тоже кэш подтекает или ты просто прикидываешься "своим"?', [
    { text: 'Я свой.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'Z3R0', 'А, брат по пустоте. Сигнатура резонирует с энтропией. Район признал тебя за своего. Нужно устроить "Ночной Скан" для Регуляторов. Поможешь?', [
    { text: 'Я в деле, Z3R0.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'Z3R0', 'Ты... ты понимаешь смысл Null. Это не пустота, это возможность. Глюк говорит, что ты — будущая сингулярность. Поработаем над этим?', [
    { text: 'Давай задачи.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'Z3R0', 'Твой код пахнет стабильностью GigaBank и лицензионным софтом. Слишком много порядка. Проваливай, пока я не зациклил твое сознание бесконечной рекурсией.', [
    { text: 'Я изменюсь.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'Z3R0', 'Парень, ты вибрируешь. Стресс прекрасен, энтропия растет, но сейчас ты слишком нестабилен даже для нас. Очисти кэш в баре, пока не рассыпался на сектора.', [
    { text: 'Я в порядке.', nextId: 'intro' },
    { text: 'Остываю.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'Z3R0', 'Тот скан Регуляторов до сих пор крутит им логи... Молодец. Готов к новой дестабилизации или просто зашел поглазеть на пустоту?', [
    { text: 'Давай контракт.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_chertanovo_combat_night_scan_bug_sweep' })
  .addNode('intro_repeat_v2', 'Z3R0', 'Ячейка Анархистов уважает твой стиль. Ты дерешься как неисправный бот — хаотично и эффективно. Сделаем еще прозвон?', [
    { text: 'Сделаем.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_faction', 'Z3R0', 'Пустота — это начало. Мы — Nullpointers, те, кто отказался от индексации. Свобода — это отсутствие типа и привязки к Ядру.', 'intro', 'Nullpointers')

  // === QUEST NODES ===
  .addNode('intro_found', 'Z3R0', 'Глюк? Этот старый кусок легаси-кода всё еще дышит? Ха. Раз ты нашел путь через его бред, значит в тебе есть искра энтропии. Добро пожаловать в Пустоту.', [
    { text: 'Спасибо... наверное.', nextId: 'intro', completeQuestId: 'q_chertanovo_find_zero', reputationReward: { factionId: 'ANARCHO_VOID', amount: 15 } }
  ])

  .addNode('quest_explain_1', 'Z3R0', 'Либо спарринг с "Ячейкой", либо "Ночной Скан" — перехват данных под носом патрулей. Как будем действовать?', [
    { text: 'Прямой бой с Ячейкой.', nextId: 'quest_explain_2' },
    { text: 'Скрытый "Ночной Скан". (Technical)', nextId: 'quest_tech_path', requireMinLevel: 3 },
    { text: 'Использовать связи с Анархистами. (Social)', nextId: 'quest_social_path', requireReputation: { factionId: 'ANARCHO_VOID', minPoints: 20 } }
  ])
  .addNode('quest_explain_2', 'Z3R0', 'Наши радикалы не знают жалости. Выживешь — станешь легендой Гетто. Рискнешь?', [
    { text: 'Проверяй мой стек.', nextId: 'rank_check' },
    { text: 'Надо подумать.', nextId: 'intro' }
  ])
  .addNode('quest_tech_path', 'Z3R0', 'Взлом 404-го порта? Красиво. Если прерывание будет чистым — соберешь всё без выстрелов. Берешь?', [
    { text: 'Да. Проверяй допуск.', nextId: 'rank_check' }
  ])
  .addNode('quest_social_path', 'Z3R0', 'Твоя репутация дает ключи от ретрансляторов Анархо-пустоты. Просто "вымоешь" логи и уйдешь. Готов?', [
    { text: 'Готов. Сканируй.', nextId: 'rank_check' }
  ])

  // === RANK CHECK ===
  .addNode('rank_check', 'Z3R0', 'Дай гляну сигнатуру... Скан порта запущен. Надеюсь, ты не "битый" сектор.', [
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'Z3R0', 'Зеленый еще. Нос не дорос. Ячейка сотрет тебя за три такта, и Ядро даже не заметит потери. Вернись позже.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'Z3R0', 'Код тут пахнет озоном и дешёвым кофе. Выбери сценарий. Ночной скан — это не мистика: ls, grep, scp; сорвёшь порядок — сорвёшь себе пальцы.', [
    { text: '[ ТРЕНИРОВКА С ЯЧЕЙКОЙ ]', nextId: 'LEAVE', awardQuestId: 'q_chertanovo_combat_anarcho_cell_bug_sweep' },
    { text: '[ СТАРТ НОЧНОГО СКАНА ]', nextId: 'LEAVE', awardQuestId: 'q_chertanovo_combat_night_scan_bug_sweep' }
  ])

  .addNode('quest_talk', 'Z3R0', 'Манифест? Ха! Держи копию — это навсегда изменит твой взгляд на код и реальность.', [
    { text: 'Принять Манифест', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'fn_ping' }
  ])

  .build();
