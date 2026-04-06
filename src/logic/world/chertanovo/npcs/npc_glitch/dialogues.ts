import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_glitch_dialogue: DialogueTree = new DialogueBuilder('npc_glitch')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ГЛЮК', 'Stack... Overflow... Null... Дай битов танцующим процессам... Всё равно всё будет стерто в следующем цикле.', [
    { text: 'Где найти Z3R0?', nextId: 'ask_zero' },
    { text: 'О чем ты говоришь?', nextId: 'lore' },
    { text: '[Дать 1 Bit]', nextId: 'reward', cost: 1 },
    { text: '[Игнорировать]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ГЛЮК', '0101... Я видел Ядро без масок... Оно улыбалось... Помоги дописать этот кусок легаси-кода... Пожалуйста...', [
    { text: 'Я помогу.', nextId: 'reward' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ГЛЮК', 'Помню... твой хеш... Чистый... Как небо до Ядра... Возьми это... Оно не спасет, но согреет деку.', [
    { text: 'Спасибо.', nextId: 'reward' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ГЛЮК', 'Ааа! Лицензия! Я вижу твой серийный номер! В тебе GigaBank! Сгинь, пока я не зациклил твой интерфейс!', [
    { text: 'Тише...', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ГЛЮК', 'Ты... как я... Дрожишь на границе сегмента... Иди в бар... Там льют "404"... Это временное решение.', [
    { text: 'Остываю.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ГЛЮК', 'Z3R0... Он нашел тебя... Я слышу их прерывания... Ты молодец... Код еще жив...', [
    { text: 'Рассказывай.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_chertanovo_find_zero' })

  // === LORE ===
  .addLoreNode('lore', 'ГЛЮК', 'Я был Senior... Не входи в Deep Web без брони... Помни... прерывания не спят...', 'intro')

  // === QUESTS ===
  .addNode('ask_zero', 'ГЛЮК', '*глаза дергаются* Z3R0... Он видит Пустоту. Он там, где биты обнуляются... в центре Гетто. Скажи ему, что Глюк всё еще помнит... наши старые домены.', [
    { text: 'Я найду его.', nextId: 'intro', awardQuestId: 'q_chertanovo_find_zero' }
  ])

  .addNode('reward', 'ГЛЮК', 'Бит... Вкусный... Держи подарок... Тщетность бытия... Но полезная...', [
    { text: 'Забрать софт "Stack Archaeologist"', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'reac_stack_archaeologist' }
  ])

  .build();
