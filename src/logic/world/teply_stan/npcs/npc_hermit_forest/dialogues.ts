import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_hermit_forest_dialogues = new DialogueBuilder('npc_hermit_forest').withDistrict('teply_stan')
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
    { text: '[ ПРИНЯТЬ: БИО-СКАН ]', nextId: 'LEAVE', awardQuestId: 'q_teply_stan_bio_scan' }
  ])
  .addLoreNode('lore', 'ЛЕСНОЙ_ОТШЕЛЬНИК', 'МКАД — это не бетон. Это огромный файрвол от энтропии. В "Проломе" 5-го сектора видна Пустота. (+10 Репутации)', 'LEAVE', 'Void', { effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'ANARCHO_VOID' })
  .build();
