import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_slick_shady_dialogues = new DialogueBuilder('npc_slick_shady').withDistrict('mitino')
  .addNode('intro', 'СЛИК (СКУПЩИК)', 'Тсс... Не шуми. Стены имеют уши. Сделка через теневой шлюз, но линии "барахлят". Нужен проверочный пинг без ведома Регуляторов.', [
    { text: 'Кто такие Регуляторы?', nextId: 'lore_market' },
    { text: 'Откалибровать частоты (Technical).', nextId: 'branch_tech_1' },
    { text: 'Дать взятку Инспектору (Social: 120 Bits).', nextId: 'branch_social_1', cost: 120 },
    { text: 'Встречу их силой (Combat).', nextId: 'branch_combat_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore_market', 'СЛИК (СКУПЩИК)', 'Регуляторы — цепные псы GigaBank. Следят за чистотой эфира. Если поймают — дека превратится в кирпич раньше, чем скажешь "Hello World". (+Intel: Регуляторы)', 'intro', 'Regulators')
  .addNode('branch_tech_1', 'СЛИК (СКУПЩИК)', 'Тонко. Нужно подменить заголовки так, чтобы выглядели как шум атмосферы. Твои логи чистые для такого маневра?', [
    { text: '[ НАЧАТЬ КАЛИБРОВКУ ]', nextId: 'branch_tech_check', requireMinLevel: 4 },
    { text: 'Нет, это слишком сложно.', nextId: 'intro' }
  ])
  .addNode('branch_tech_check', 'СЛИК (СКУПЩИК)', '[SUCCESS] Пи-и-ип... Слышишь? Совершенно чистый сигнал. Регуляторы даже не заметят терабайты данных. Держи долю.', [
    { text: 'Рад помочь. (Завершен)', nextId: 'LEAVE', completeQuestId: 'q_mitino_black_market_ping', effect: 'GIVE_CARD', cardRewardId: 'fn_ping_stealth' }
  ])
  .addNode('branch_social_1', 'СЛИК (СКУПЩИК)', 'Bits решают проблемы. Инспектор прошел мимо узла, "не заметив" активности. Линия проверена, забирай бонусы.', [
    { text: 'Сотрудничество — сила. (Завершен)', nextId: 'LEAVE', completeQuestId: 'q_mitino_black_market_ping' }
  ])
  .addNode('branch_combat_start', 'СЛИК (СКУПЩИК)', 'Агрессивно. Регуляторы уже выслали дронов-глушилок. Чтобы пробить их щиты, нужен ритм: сначала найти узел (ls), затем пингануть его (ping). Если разберешь их — сможем гнать сигнал в открытую. В путь?', [
    { text: '[ ВСТРЕТИТЬ РЕГУЛЯТОРОВ: БОЙ ]', nextId: 'LEAVE', awardQuestId: 'q_mitino_combat_freq_jam_bug_sweep' }
  ])
  .build();
