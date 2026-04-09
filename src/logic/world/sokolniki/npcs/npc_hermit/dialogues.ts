import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_hermit_dialogues = new DialogueBuilder('npc_hermit').withDistrict('sokolniki')
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
  .addNode('intro_stressed', 'ОТШЕЛЬНИК', 'Твой кулер захлебывается, кодер. Лес чувствует твоё напряжение. Сходи к Глубинному Корню, остынь.', [
    { text: 'Ладно.', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'ОТШЕЛЬНИК', 'Снова в лабиринте? Рекурсия не прощает ошибок. Готов к новой попытке?', [
    { text: 'Готов.', nextId: 'quest_explain_1' }
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
  .addNode('quest_accept', 'ОТШЕЛЬНИК', 'Сильный сигнал. Глубокий корень. Хорошо, разорви петлю. Да пребудет с тобой чистота алгоритма. (Принять контракт)', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ: РЕКУРСИЯ ]', nextId: 'LEAVE', awardQuestId: 'q_sokolniki_combat_recursive_loop_bug_sweep' }
  ])
  .build();
