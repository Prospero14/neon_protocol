import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_rocket_eng_dialogues = new DialogueBuilder('npc_rocket_eng')
  .addNode('intro', 'СТЕПАНЫЧ', 'Чего застыл? Здесь не музей, здесь колыбель русского космоса... ну, того, что от него осталось в битах. Я Степаныч, слежу, чтобы старые движки не пошли вразнос от корпоративных вирусов.', [
    { text: 'Расскажи про Хруничев.', nextId: 'lore_khrunichev' },
    { text: 'Нужна помощь с железом.', nextId: 'quest_explain' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addLoreNode('lore_khrunichev', 'СТЕПАНЫЧ', 'Раньше здесь строили гигантов. "Протоны", "Ангары"... Теперь строим только виртуальные щиты, чтобы GigaBank не сожрал наши архивы. Но дух металла всё еще в коде. (+Intel: Redundants)', 'intro')
  .addNode('quest_explain', 'СТЕПАНЫЧ', 'Железо старое, капризное. Нужно заменить шину в секторе 4. Там дроны взбесились, думают, что идет запуск. Справишься — дам тебе титановый корпус.', [
    { text: '[ ПРИНЯТЬ: ТЯГА МЕТАЛЛА ]', nextId: 'LEAVE', awardQuestId: 'q_fili_hardware_repair' }
  ])
  .build();
