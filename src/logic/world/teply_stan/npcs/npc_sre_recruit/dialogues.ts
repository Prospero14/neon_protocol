import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_sre_recruit_dialogues = new DialogueBuilder('npc_sre_recruit').withDistrict('teply_stan')
  .addNode('intro', 'РЕКРУТ_ПАТРУЛЯ', 'Егерь говорит, я не готов. А я хочу в бой с химерами! Поможешь мне с тренировкой?', [
      { text: 'Я помогу тебе. Проверь мою деку.', nextId: 'rank_check' },
      { text: 'Слушай Егеря, стажер.', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'РЕКРУТ_ПАТРУЛЯ', 'Нужно быть хотя бы первого уровня, чтобы не "сгореть"... Покажи логи.', [
      { text: '[ Сканирование ]', nextId: 'quest_reject', requireMaxLevel: 0, isTraineeOnly: true },
      { text: '[ Сканирование ]', nextId: 'quest_accept', requireMinLevel: 1 },
      { text: '[ Сканирование ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'РЕКРУТ_ПАТРУЛЯ', 'Ой... Ты совсем новенький. Нос не дорос даже до тренировки. Набери опыта в Хабе!', [
      { text: 'Понял.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'РЕКРУТ_ПАТРУЛЯ', 'О, ты уже умеешь! Твой отклик быстрее, чем у Егеря по утрам. Зачистим узел! (Принять контракт)', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: ТРЕНИРОВКА ]', nextId: 'LEAVE', awardQuestId: 'q_teply_stan_combat_wild_node_bug_sweep' }
  ])
  .build();
