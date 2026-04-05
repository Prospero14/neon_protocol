import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const sokolniki_dialogues: Record<string, DialogueTree> = {
  // --- HERMIT (NULLPOINTERS) ---
  npc_hermit: new DialogueBuilder('npc_hermit')
    .withGreetings({
      neutral: ['intro'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'ОТШЕЛЬНИК', 'Слышишь шум листвы? Это гул старых кулеров в корнях. Я Отшельник, кодил для Nullpointers, но теперь лес — мой терминал. Зачем пришел?', [
      { text: 'Кто такие Nullpointers?', nextId: 'lore_faction' },
      { text: 'Ищу мудрость.', nextId: 'wisdom' },
      { text: 'Нужна работа по зачистке.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'ОТШЕЛЬНИК', 'Твой код чист, как роса на оптоволокне. Рад тому, кто не продал сигнатуру GigaBank. Есть аномалия в корнях...', [
      { text: 'Рассказывай.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_hostile', 'ОТШЕЛЬНИК', 'Твой шум пугает лес. Ты пахнешь корпоративными лицензиями. Уходи, пока тебя не поглотила Рекурсия.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'ОТШЕЛЬНИК', 'Nullpointers — те, кто выпал из системы. Мы верим в ничейный алгоритм. В лесу мы храним "мусор", ставший основой всего. (+Intel: Nullpointers)', 'intro', 'Nullpointers')
    .addLoreNode('wisdom', 'ОТШЕЛЬНИК', 'Мудрость — уменье ждать, пока Ядро сожрет само себя. Но если хочешь силы — иди к Глубинному Дереву. Там Истина.', 'intro')
    .addNode('quest_explain_1', 'ОТШЕЛЬНИК', 'В глубине парка завелась рекурсивная петля. Высасывает энергию из подсетей. Нужно разорвать её прерыванием. Это сожрет память, если медлить.', [
      { text: 'Как разорвать цикл?', nextId: 'quest_explain_2' },
      { text: 'Я готов.', nextId: 'rank_check' }
    ])
    .addNode('quest_explain_2', 'ОТШЕЛЬНИК', 'Нужен "Dirty Hack" или мощный "Buffer Overflow". Если стек не выдержит — станешь частью петли навсегда. Идешь?', [
      { text: 'Иду.', nextId: 'rank_check' },
      { text: 'Позже.', nextId: 'intro' }
    ])
    .addNode('rank_check', 'ОТШЕЛЬНИК', 'Ну-ка... (Прижимает ладонь к интерфейсу деки, закрыв глаза...)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ОТШЕЛЬНИК', 'Твой код пока слишком шумный. На лесных частотах это опасно. Возвращайся позже.', [
      { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ОТШЕЛЬНИК', 'Сильный сигнал. Глубокий корень. Хорошо, разорви петлю. Да пребудет con тобой чистота алгоритма. (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: РЕКУРСИЯ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokolniki_combat_recursive_loop_bug_sweep' }
    ])
    .build(),

  // --- ARBORIS (DRUID CODER) ---
  npc_druid_coder: new DialogueBuilder('npc_druid_coder')
    .withGreetings({
      neutral: ['intro'],
      friendly: ['intro_friendly'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'АРБОРИС', 'Био-ритмы леса в упадке... Почва пропитана коррозийным кодом GigaBank. Мне нужны замеры из трех узловых корней. Поможешь?', [
      { text: 'Как провести замеры?', nextId: 'quest_explain' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_explain', 'АРБОРИС', 'Просканируй почву в точках резонанса. Это простая диагностика, но она спасет экосистему района. Согласен?', [
      { text: 'Я сделаю это.', nextId: 'quest_accept' },
      { text: 'Нет времени на траву.', nextId: 'intro' }
    ])
    .addNode('quest_accept', 'АРБОРИС', 'Благодарю. Каждое зерно данных важно для восстановления. Приступай.', [
      { text: '[ ПРИНЯТЬ: БИО-РИТМЫ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokolniki_herb_data' }
    ])
    .build(),

  // --- GHOST SERVER (LORE / BRANCHING QUEST) ---
  npc_ghost_server: new DialogueBuilder('npc_ghost_server')
    .addNode('intro', 'ПРИЗРАК_СЕРВЕРНОЙ', '...Ч... Читаю... Сектор 0xFF... Данные повреждены. (Мигает красным) ПОМОГИТЕ... МНЕ... вспомнить... КТО_Я?', [
      { text: 'Кто ты?', nextId: 'lore_origin' },
      { text: 'Попробовать стабилизировать поток (Техника)', nextId: 'branch_tech_1' },
      { text: 'Проще тебя стереть и забыть. (Удаление)', nextId: 'branch_combat_start' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('lore_origin', 'ПРИЗРАК_СЕРВЕРНОЙ', 'Я был Архивариус_Бетта. Библиотека Октября, 2072. Silicon Hedge хотел объединить сознание... Но произошел сбой.', [
      { text: 'Я помогу тебе вспомнить.', nextId: 'intro' },
      { text: 'Это звучит как приговор.', nextId: 'intro' }
    ])
    .addNode('branch_tech_1', 'ПРИЗРАК_СЕРВЕРНОЙ', 'Твоя дека... частота синхронна. Если замкнешь цепь — я восстановлюсь. Но твой CPU... он выдержит?', [
      { text: '[ ИНИЦИИРОВАТЬ СТАБИЛИЗАЦИЮ ]', nextId: 'branch_tech_check', requireMinLevel: 5 },
      { text: 'Я не рискну железом.', nextId: 'intro' }
    ])
    .addNode('branch_tech_check', 'ПРИЗРАК_СЕРВЕРНОЙ', '[SUCCESS] П... Процессы замедлились. Я вижу свет. Спасибо, кодер. Код спас остатки моей души. Возьми фрагмент ключа.', [
      { text: 'Рад помочь. (Завершить)', nextId: 'LEAVE', completeQuestId: 'q_sokolniki_haunted_logs', effect: 'GIVE_CARD', cardRewardId: 'fn_archival_access' }
    ])
    .addNode('branch_combat_start', 'ПРИЗРАК_СЕРВЕРНОЙ', '[WARNING] ЗАЩИТНЫЕ_ПРОТОКОЛЫ_АКТИВИРОВАНЫ. ТЫ... ТЫ_УБИЙЦА! (Голограмма превращается в агрессивный красный шум)', [
      { text: '[УНИЧТОЖИТЬ КОРРУПЦИЮ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_sokolniki_combat_fox_virus_bug_sweep' }
    ])
    .build(),
};
