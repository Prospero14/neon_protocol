import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_spider_dialogues = new DialogueBuilder('npc_spider')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'SPIDER', 'Тише, неофит. Nullpointers не прощают болтливости. Мы — призраки в машине. Ищешь правду или просто Bits?', [
    { text: 'Ищу способ взломать Систему.', nextId: 'lore_world' },
    { text: 'Кто такие Nullpointers?', nextId: 'lore_faction' },
    { text: 'Нужен спец-софт. (50 Bits)', nextId: 'trade', cost: 50 },
    { text: 'Слава Свободным Данным! ( +10 NULLPOINTERS )', nextId: 'loyalty', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'SPIDER', '*не поднимает взгляда* Сеть мониторит все транзакции. Говори коротко. Что нужно?', [
    { text: 'Мне нужен эксплойт.', nextId: 'trade' },
    { text: 'Просто поговорить.', nextId: 'lore_faction' }
  ])
  .addNode('intro_friendly', 'SPIDER', 'Свой. Помню тебя по делу в Перово. Мы таких не забываем. Новые эксплойты пришли из-за периметра.', [
    { text: 'Давай посмотрим.', nextId: 'trade' }
  ])
  .addNode('intro_hostile', 'SPIDER', '*смотрит прямо* Сигнатура говорит — ты мелькал рядом с GigaBank. Я не торгую с теми, кто греет уши чужим ботам. Уходи.', [
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'SPIDER', 'Что-то не так с твоим соединением. Пульсации нестабильные. Не хочу, чтобы меня спалили вместе с тобой. Отойди и успокойся.', [
    { text: 'Я в норме. Говори.', nextId: 'trade' }
  ])
  .addNode('intro_repeat', 'SPIDER', 'Снова в тени. Значит, снова нужен товар. Поставки нерегулярные — что есть сегодня, завтра уже в эфире.', [
    { text: 'Смотрим, что есть.', nextId: 'trade' }
  ])
  .addLoreNode('lore_faction', 'SPIDER', 'Мы — те, кто выпал из реестров. Код принадлежит всем, а не High-Tier Сити. Мы — ошибка, которую невозможно исправить. (+Intel: Nullpointers)', 'intro', 'Nullpointers')
  .addLoreNode('lore_world', 'SPIDER', 'В 2024-м Ядро Октября лишилось контроля над Moscow Zero. Пакеты всё равно теряются. Мы — те самые пакеты, обретшие волю.', 'intro')
  .addNode('trade', 'SPIDER', 'Быстро. Выбирай и уходи.', [
    { text: 'fn_shadow_copy: Призрак в системе (150 Bits)', nextId: 'intro', cost: 150, effect: 'GIVE_CARD', cardRewardId: 'fn_shadow_copy' },
    { text: 'fn_void_packet: Невидимый пакет (200 Bits)', nextId: 'intro', cost: 200, effect: 'GIVE_CARD', cardRewardId: 'fn_void_packet' },
    { text: '[ Закрыть ]', nextId: 'intro' }
  ])
  .addNode('loyalty', 'SPIDER', 'Наш человек. ГигаБанк считает нас багом, но мы — сама ОС реальности. Держи ключ, пригодится в Гетто.', [
    { text: 'Смерть Корпоратам.', nextId: 'intro' }
  ])
  .build();
