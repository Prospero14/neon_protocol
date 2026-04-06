import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_old_timer_dialogues = new DialogueBuilder('npc_old_timer')
  .withGreetings({
    neutral: ['intro', 'intro_v2']
  })
  .addNode('intro', 'СТАРЫЙ_РАДИСТ', 'Слышишь треск? Это голос Москвы 1990-х. Радиоволны помнят всё. Чего ищешь, малец?', [
    { text: 'Кто такие Voskhod?', nextId: 'lore_voskhod' },
    { text: 'Вы разбираетесь в лампах?', nextId: 'quest_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СТАРЫЙ_РАДИСТ', '*крутит приемник* GigaBank пытается заглушить "Свободу". Но аналоговый сигнал не убить.', [
    { text: 'Расскажите о Voskhod.', nextId: 'lore_voskhod' }
  ])
  .addLoreNode('lore_voskhod', 'СТАРЫЙ_РАДИСТ', 'Voskhod — это фундамент. Мы строили город на логике, а не на микротранзакциях. (+5 Репутации)', 'intro', 'Voskhod', { effect: 'GIVE_REPUTATION', amount: 5 })
  .addNode('quest_start', 'СТАРЫЙ_РАДИСТ', 'Лампы? Парень, на деке только кристаллы. Но если хочешь помочь — найди "Vintage Capacitor" на свалке. Верстак подскажет.', [
    { text: 'Я поспрашиваю Верстака.', nextId: 'quest_accept' },
    { text: 'Нет времени.', nextId: 'intro' }
  ])
  .addNode('quest_accept', 'СТАРЫЙ_РАДИСТ', 'Иди, и не свети портом на каждом углу.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_izmailovo_old_timer_capacitor' }
  ])
  .build();
