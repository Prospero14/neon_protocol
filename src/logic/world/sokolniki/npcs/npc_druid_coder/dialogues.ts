import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_druid_coder_dialogues = new DialogueBuilder('npc_druid_coder')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'АРБОРИС', 'Био-ритмы леса в упадке... Почва пропитана коррозийным кодом GigaBank. Мне нужны замеры из трех узловых корней. Поможешь?', [
    { text: 'Как провести замеры?', nextId: 'quest_explain' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'АРБОРИС', 'Био-ритмы в резонансе. Ты понимаешь язык деревьев лучше многих. Поможешь ускорить рост?', [
    { text: 'Выполняю.', nextId: 'intro' }
  ])
  .addNode('intro_repeat', 'АРБОРИС', 'Замеры продолжаются. Почва всё ещё хранит следы GigaBank. Сделаешь еще один круг?', [
    { text: 'Всегда готов.', nextId: 'intro' }
  ])
  .addNode('quest_explain', 'АРБОРИС', 'Просканируй почву в точках резонанса. Это простая диагностика, но она спасет экосистему района. Согласен?', [
    { text: 'Я сделаю это.', nextId: 'quest_accept' },
    { text: 'Нет времени на траву.', nextId: 'intro' }
  ])
  .addNode('quest_accept', 'АРБОРИС', 'Благодарю. Каждое зерно данных важно для восстановления. Приступай.', [
    { text: '[ ПРИНЯТЬ: БИО-РИТМЫ ]', nextId: 'LEAVE', awardQuestId: 'q_sokolniki_herb_data' }
  ])
  .build();
