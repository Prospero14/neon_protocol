import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_barman_dialogues = new DialogueBuilder('npc_barman').withDistrict('kitay_gorod')
  .addNode('intro', 'БАРМЕН', '«NullPointer» — как всегда: сладко на входе, горько на выходе. Здесь платят тем, кто пережил очередной цикл без перезагрузки личности.', [
    { text: 'Бесплатный напиток [ ТРЕБУЕТ GIGABANK: 20 ]', nextId: 'bar_free', requireReputation: { factionId: 'GIGABANK', minPoints: 20 } },
    { text: 'Купить «Дебаг» (20 Bits)', nextId: 'intro', cost: 20, effect: 'RESTORE_HP', amount: 30 },
    { text: 'Двойная фильтрация (50 Bits)', nextId: 'intro', cost: 50, effect: 'RESTORE_HP', amount: 80 },
    { text: 'Назад', nextId: 'LEAVE' }
  ])
  .addNode('bar_free', 'БАРМЕН', 'Уважаемый гость. GigaBank оплатил ваш счет за лояльность. Пейте на здоровье своего нейростека.', [
    { text: 'За GigaBank!', nextId: 'intro', effect: 'RESTORE_HP', amount: 50 }
  ])
  .build();
