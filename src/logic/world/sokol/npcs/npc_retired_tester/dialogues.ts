import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_retired_tester_dialogue: DialogueTree = new DialogueBuilder('npc_retired_tester')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'СЕМЕНЫЧ', 'Баги в авионике — это не шутки, сынок... Хочешь почувствовать, как дрожали прерывания в сороковые? Мы правили их напрямую в памяти. Сейчас всё... абстрактно.', [
    { text: 'Я готов к испытанию.', nextId: 'quest_explain_1' },
    { text: 'Разработчик авионики ищет чип "Стриж-4"...', nextId: 'quest_fetch_give', requireQuestId: 'q_sokol_fetch_chip_quest' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СЕМЕНЫЧ', '*чистит контакты ветошью* Эх, молодежь... Сначала — тесты на стенде, потом — полет. Хочешь проверить свой стек на прочность в условиях реальной перегрузки?', [
    { text: 'Хочу.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'СЕМЕНЫЧ', 'Слышишь гул моторов? Дроны Сокола... Если код не летает — это не авионика, это мусор. Согласен?', [
    { text: 'Согласен.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'СЕМЕНЫЧ', 'О, надежный юнит! Вижу, рой тебя не свалил. Твои логи — загляденье. Рискнешь своим железом ради старика еще раз?', [
    { text: 'Рискну.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'СЕМЕНЫЧ', 'Твой код лаконичен и смертоносен. Помню, как мы в Соколе зачищали целые сегменты от "битых" кадров... Пойдешь на дефрагментацию серверной?', [
    { text: 'Веди, Семёныч.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'СЕМЕНЫЧ', 'В тебе слишком много Nullpointers-шума. Ступай к Анархистам, там тебя научат... плохому. А здесь — территория Чистого Синтаксиса.', [
    { text: 'Я остыну.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'СЕМЕНЫЧ', 'Парень, у тебя CPU визжит громче моих первых реле. Сходи в "Пропеллер", пока не поймал "hard reset". В таком состоянии ты только баги размножаешь.', [
    { text: 'Я справлюсь.', nextId: 'intro' },
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'СЕМЕНЫЧ', 'Снова за острыми байтами? Рой не дремлет, а серверная всё еще кипит. Готов лезть в пекло ради EU Syntax?', [
    { text: 'Готов.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_sokol_combat_drone_swarm_bug_sweep' })
  .addNode('intro_repeat_v2', 'СЕМЕНЫЧ', 'Тот чип "Стриж" еще послужит авионике... Молодец, не подвел. Есть еще работа.', [
    { text: 'Рассказывай.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === QUESTS ===
  .addNode('quest_explain_1', 'СЕМЕНЫЧ', 'Либо "Соколы" взбесились, либо серверная кипит. Как будешь решать проблему, стажер?', [
    { text: 'Прямая зачистка роя (Бой).', nextId: 'quest_explain_2' },
    { text: 'Перекалибровка шлюза. (Technical)', nextId: 'quest_tech_path', requireMinLevel: 3 },
    { text: 'Рекомендация Декана. (Social)', nextId: 'quest_social_path', requireReputation: { factionId: 'EU_SYNTAX', minPoints: 20 } }
  ])
  .addNode('quest_explain_2', 'СЕМЕНЫЧ', 'Это не для слабаков — один лаг, и ты превратишься в кучку горелых транзисторов. Уверен в своем стеке?', [
    { text: 'Стабилен. Проверяй.', nextId: 'rank_check' },
    { text: 'Надо подумать.', nextId: 'intro' }
  ])
  .addNode('quest_tech_path', 'СЕМЕНЫЧ', 'Перехватить управление? Смело. Если вобьешь верный хеш — рой сядет сам. Берешься?', [
    { text: 'Берусь.', nextId: 'rank_check' }
  ])
  .addNode('quest_social_path', 'СЕМЕНЫЧ', 'О, печать Декана... Тогда пройди без очереди. Готов к "чистке"?', [
    { text: 'Готов. Проверяй.', nextId: 'rank_check' }
  ])

  // === RANK CHECK ===
  .addNode('rank_check', 'СЕМЕНЫЧ', 'Ну-ка, дай гляну твою сигнатуру... Хм, не фониш ли ты Null-поинтерами?', [
    { text: '[ Ждать вердикта ]', nextId: 'quest_reject', requireMaxLevel: 2, isTraineeOnly: true },
    { text: '[ Ждать вердикта ]', nextId: 'quest_accept', requireMinLevel: 3 },
    { text: '[ Ждать вердикта ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'СЕМЕНЫЧ', 'Эх, малец... Что-то твой стек фонит. Наберись опыта, а то авионика тебя сожрет. Вернись через пару релизов.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'СЕМЕНЫЧ', 'Неплохо. Вижу почерк Архипова. Хорошо, контракты твои. Не подвели старика.', [
    { text: '[ ПРИНЯТЬ: РОЙ ДРОНОВ ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_combat_drone_swarm_bug_sweep' },
    { text: '[ ПРИНЯТЬ: СЕРВЕРНАЯ ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_combat_server_overheat_bug_sweep' }
  ])

  // === FETCH CHIP ===
  .addNode('quest_fetch_give', 'СЕМЕНЫЧ', '"Стриж-4"? Есть у меня ящик таких. Но они в грязных логах... Если прозвонишь их вручную — забирай.', [
    { text: 'Я прозвоню.', nextId: 'intro', effect: 'GIVE_ITEM', cardRewardId: 'item_strizh_chip', completeQuestId: 'q_sokol_fetch_chip_quest' }
  ])

  .build();
