import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const teply_stan_dialogues: Record<string, DialogueTree> = {
  // --- RANGER (FEDERAL OVERSIGHT) ---
  npc_ranger: new DialogueBuilder('npc_ranger')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ЕГЕРЬ', 'Стоять. Лес — территория SRE-патруля под эгидой Federal Oversight. Здесь мы ловим баги, а не туристов. Чего хотел? Твой стек выглядит неподготовленным.', [
      { text: 'Кто такие Federal Oversight?', nextId: 'lore_faction' },
      { text: 'Нужна работа по зачистке Леса.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ЕГЕРЬ', '*проверяет излучатель* Еще один гость. В Теплом Стане мы не любим шумных прерываний. Ты уважаешь тишину логов или плодишь мусор в памяти?', [
      { text: 'Я за чистый код.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ЕГЕРЬ', 'А, мастер-отладчик. Рад видеть чистую сигнатуру SRE. В 5-м секторе опять прорастает дикий код. Поможешь?', [
      { text: 'Я в деле, Егерь.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_hostile', 'ЕГЕРЬ', 'Твоя сигнатура — критическая ошибка. Покинь периметр, пока я не вызвал группу очистки.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'ЕГЕРЬ', 'Federal Oversight — щит Москвы. Мы блюдем закон Ядра там, где начинается хаос дикого кода. (+Intel: Federal Oversight)', 'intro', 'Federal Oversight')
    .addNode('quest_explain_1', 'ЕГЕРЬ', 'В чаще зародился рекурсивный цикл-паразит. Вытягивает Bits из локальных узлов. Нужно провести "Hard Reset". Как будешь работать?', [
      { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
      { text: 'Изолировать цикл (Technical).', nextId: 'quest_tech_path', requireMinLevel: 3 },
      { text: 'Использовать допуск SRE (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'FEDERAL_OVERSIGHT', minPoints: 15 } }
    ])
    .addNode('quest_explain_2', 'ЕГЕРЬ', 'Дикий код принял форму химер. У них нет логики. Бей их по портам. Рискнешь железом?', [
      { text: 'Проверяй логи.', nextId: 'rank_check' },
      { text: 'Надо подготовиться.', nextId: 'intro' }
    ])
    .addNode('quest_tech_path', 'ЕГЕРЬ', 'Хочешь "Signal Scrubber"? Если сможешь гасить всплески удаленно — бой не понадобится. Но нужно быстрое прерывание.', [
      { text: 'Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('quest_social_path', 'ЕГЕРЬ', 'Репутация SRE дает доступ к периметру. Химеры увидят в тебе "своего". Готов?', [
      { text: 'Да. Проверяй.', nextId: 'rank_check' }
    ])
    .addNode('rank_check', 'ЕГЕРЬ', 'Дай гляну страховку... (Тяжелый системный взгляд...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ЕГЕРЬ', 'Отказ. Логи — сплошные пустые указатели. Нос не дорос до настоящего Леса. Возвращайся позже.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ЕГЕРЬ', 'Годится. Пинги чистые, сигнатура охотника. Сходи и прерви цикл, пока он не сожрал район. (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: ОХОТА ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_teply_stan_combat_forest_hunt_bug_sweep' }
    ])
    .build(),

  // --- FOREST HERMIT ---
  npc_hermit_forest: new DialogueBuilder('npc_hermit_forest')
    .addNode('intro', 'ЛЕСНОЙ_ОТШЕЛЬНИК', 'Город... шум... Здесь, под корой, слышны байты, которые еще не приручили. Чего ищешь?', [
        { text: 'Я ищу тайные тропы.', nextId: 'lore' },
        { text: 'Как услышать шепот Биосинхронизации?', nextId: 'quest_bio_explain' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_bio_explain', 'ЛЕСНОЙ_ОТШЕЛЬНИК', 'Сначала нужно просканировать точки резонанса в чаще. Это поможет настроить твой нейростек на частоту Леса. Сделаешь?', [
      { text: 'Я готов.', nextId: 'quest_bio_accept' },
      { text: 'Не сейчас.', nextId: 'intro' }
    ])
    .addNode('quest_bio_accept', 'ЛЕСНОЙ_ОТШЕЛЬНИК', 'Возьми этот сканер. Иди туда, где байты резонируют с листвой.', [
      { text: '[ ПРИНЯТЬ: БИО-СКАН ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_teply_stan_bio_scan' }
    ])
    .addLoreNode('lore', 'ЛЕСНОЙ_ОТШЕЛЬНИК', 'МКАД — это не бетон. Это огромный файрвол от энтропии. В "Проломе" 5-го сектора видна Пустота. (+10 Репутации)', 'LEAVE', 'Void', { effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' })
    .build(),

  // --- SRE RECRUIT (LEVEL 1 TRAINING) ---
  npc_sre_recruit: new DialogueBuilder('npc_sre_recruit')
    .addNode('intro', 'РЕКРУТ_ПАТРУЛЯ', 'Егерь говорит, я не готов. А я хочу в бой con химерами! Поможешь мне con тренировкой?', [
        { text: 'Я помогу тебе. Проверь мою деку.', nextId: 'rank_check' },
        { text: 'Слушай Егеря, стажер.', nextId: 'LEAVE' }
    ])
    .addNode('rank_check', 'РЕКРУТ_ПАТРУЛЯ', 'Нужно быть хотя бы первого уровня, чтобы не "сгореть"... Покажи логи.', [
        { text: '[ Сканирование ]', nextId: 'quest_reject', requireMaxLevel: 0, isTraineeOnly: true },
        { text: '[ Сканирование ]', nextId: 'quest_accept', requireMinLevel: 1 },
        { text: '[ Сканирование ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'РЕКРУТ_ПАТРУЛЯ', 'Ой... Ты совсем новенький. Нос не дорос даже до тренировки. Набери опыта в Хабе!', [
        { text: 'Понял.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'РЕКРУТ_ПАТРУЛЯ', 'О, ты уже умеешь! Твой отклик быстрее, чем у Егеря по утрам. Зачистим узел! (Принять контракт)', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ: ТРЕНИРОВКА ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_teply_stan_combat_wild_node_bug_sweep' }
    ])
    .build(),

  // --- SHOPS & BARS ---
  shop_forest: new DialogueBuilder('shop_forest')
    .addNode('intro', 'ЛЕСНИК', 'У меня только дикие модули. Никаких лицензий GigaBank, только чистая мощь SRE.', [
        { text: 'SRE Monitor (30 Bits)', nextId: 'intro', cost: 30, effect: 'GIVE_CARD', cardRewardId: 'fn_ping' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  shop_wild: new DialogueBuilder('shop_wild')
    .addNode('intro', 'ДИКИЙ_РЫНОК', 'Контрабанда из-за МКАДа. Софт без подписи, но работает там, где пасует официалка.', [
        { text: 'Garbage Collector V2 (60 Bits)', nextId: 'intro', cost: 60, effect: 'GIVE_CARD', cardRewardId: 'fn_wash_logs' },
        { text: 'ПАКЕТНАЯ_СКРЫТНОСТЬ (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_TRAIT', cardRewardId: 'script_ghost' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),

  bar_forest_shadow: new DialogueBuilder('bar_forest_shadow')
    .addNode('intro', 'ТАВЕРНА_ТЕНЬ_ЛЕСА', 'Сруб, обшитый серверными панелями. Пьем березовый хладагент.', [
        { text: 'Кружка "Лесного Эха" (15 Bits)', nextId: 'intro', cost: 15, effect: 'RESTORE_HP', amount: 30 },
        { text: 'Ночлег в корнях (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 100 },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .build(),

  term_nature_log: new DialogueBuilder('term_nature_log', 'intro')
    .addNode('intro', 'МОНИТОР_ЭКОСИСТЕМЫ', '[DATA_STREAM] Заражение леса: 45%. Рекомендуется зачистка сектора 5.', [
        { text: 'Запустить диагностику узла.', nextId: 'rank_check' },
        { text: '[Выход]', nextId: 'LEAVE' }
    ])
    .addNode('rank_check', 'МОНИТОР_ЭКОСИСТЕМЫ', '[SCANNING...] ТРЕБУЕТСЯ УРОВЕНЬ 1+.', [
        { text: '[ Ждать ]', nextId: 'access_denied', requireMaxLevel: 0, isTraineeOnly: true },
        { text: '[ Ждать ]', nextId: 'access_granted', requireMinLevel: 1 },
        { text: '[ Ждать ]', nextId: 'access_granted', isProOnly: true }
    ])
    .addNode('access_denied', 'МОНИТОР_ЭКОСИСТЕМЫ', '[ERROR] НИЗКИЙ ПРИОРИТЕТ ДОСТУПА. (ACCESS_DENIED)', [
        { text: 'Вернусь позже.', nextId: 'LEAVE' }
    ])
    .addNode('access_granted', 'МОНИТОР_ЭКОСИСТЕМЫ', '[SUCCESS] ДОПУСК РАЗРЕШЕН. БОНУС: 50 Bits.', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_teply_stan_combat_router_clash_bug_sweep' }
    ])
    .build(),
};
