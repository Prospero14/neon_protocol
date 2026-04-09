import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_forest_guard_dialogues = new DialogueBuilder('npc_forest_guard').withDistrict('sokolniki')
  .addNode('intro', 'ЛЕСНИК', 'Стой. Территория GigaBank. Физический доступ к стойкам разрешен только персоналу SYS_SEC. Твои логи выглядять... нелицензионно.', [
    { text: 'Я просто гуляю.', nextId: 'lore_warning' },
    { text: 'У меня есть допуск. (Social)', nextId: 'check_rep', requireReputation: { factionId: 'GIGABANK', minPoints: 10 } },
    { text: 'Мне нужно в серверную. (Technical)', nextId: 'check_tech', requireMinLevel: 4 },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('lore_warning', 'ЛЕСНИК', 'Гуляй в Хабе. Здесь работают серьезные люди и шумные машины. Любое прерывание будет расценено как попытка взлома. Понял?', [
    { text: 'Понял.', nextId: 'intro' }
  ])
  .addNode('check_rep', 'ЛЕСНИК', 'Вижу сигнатуру лояльности. Проходи, но не трогай кабели. Мы и так воюем с корнями за каждый порт.', [
    { text: 'Спасибо.', nextId: 'LEAVE' }
  ])
  .addNode('check_tech', 'ЛЕСНИК', 'Техник? Выглядишь как фрилансер. Ладно, есть одна стойка в 4-м секторе, она постоянно штормит. Если починишь — закрою глаза на твое присутствие.', [
    { text: '[ ПРИНЯТЬ: РЕМОНТ СТОЙКИ ]', nextId: 'LEAVE', awardQuestId: 'q_sokolniki_hardware_repair' }
  ])
  .build();
