import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_archivist_dialogues = new DialogueBuilder('npc_archivist')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'АРХИВАРИУС', 'Каждый байт имеет значение... Я нашел аномалию в логах Фили. Это похоже на тени GigaBank. Нужно передать их Аудитору в Таганку.', [
    { text: 'Что в логах?', nextId: 'lore' },
    { text: 'Я доставлю логи.', nextId: 'quest_accept' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'АРХИВАРИУС', 'Мой надежный курьер. Твоя индексация всегда точна. Есть новые данные, требующие тишины.', [
    { text: 'Я слушаю.', nextId: 'intro' }
  ])
  .addNode('intro_repeat', 'АРХИВАРИУС', 'Логи всё еще копятся. GigaBank не спит. Продолжим очистку истории?', [
    { text: 'Да.', nextId: 'intro' }
  ])
  .addLoreNode('lore', 'АРХИВАРИУС', 'Там записи о транзакциях, которых не должно быть. Кто-то вымывает Bits из района. (+Intel: GigaBank Shadows)', 'intro')
  .addNode('quest_accept', 'АРХИВАРИУС', 'Будь осторожен. Аудитор в Таганке — человек непростой. Но он знает, как читать между строк.', [
    { text: '[ ПРИНЯТЬ: ДОСТАВКА ЛОГОВ ]', nextId: 'LEAVE', awardQuestId: 'q_fili_audit_logs' }
  ])
  .build();
