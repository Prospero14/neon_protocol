import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_mira_dialogues = new DialogueBuilder('npc_mira')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'MIRA (NK)', 'Точность. Честь. Кремний. Нас интересует эффективность. У тебя в логах мусор. Хочешь апгрейд или будешь лагать всю жизнь?', [
    { text: 'Узнать про Silicon Hedge.', nextId: 'lore_faction' },
    { text: 'Купить чип стабилизации (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_BITS', amount: 128 },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'MIRA (NK)', '*изучает твою сигнатуру* Процессор недогружен. Потенциал используется на 47%. Это неприемлемо.', [
    { text: 'Что ты можешь предложить?', nextId: 'intro' }
  ])
  .addNode('intro_friendly', 'MIRA (NK)', 'Снова ты. Твои метрики улучшились. Мы в Silicon Hedge следим за прогрессом перспективных операторов.', [
    { text: 'Что нового из апгрейдов?', nextId: 'intro' }
  ])
  .addNode('intro_hostile', 'MIRA (NK)', 'Твои показатели ниже порогового значения Silicon Hedge. Мы не тратим вычислительные ресурсы на неэффективных операторов. Уходи.', [
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'MIRA (NK)', 'Уровень стресса в твоих пакетах критический. Нейростек перегружен. Лечение и стабилизация перед деловым разговором.', [
    { text: 'Дай что-нибудь успокоительное.', nextId: 'intro' }
  ])
  .addNode('intro_repeat', 'MIRA (NK)', 'Снова ищешь совершенства? Правильная позиция. Silicon Hedge одобряет стремление к оптимальности.', [
    { text: 'Что новенького?', nextId: 'intro' }
  ])
  .addLoreNode('lore_faction', 'MIRA (NK)', 'Мы — следующая итерация. Плоть слаба, мысли медленны. Мы стремимся к чистому осознанию без потерь. Мы — идеальный процесс. (+Intel: Silicon Hedge)', 'intro', 'Silicon Hedge')
  .build();
