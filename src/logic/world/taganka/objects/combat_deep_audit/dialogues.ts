import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_deep_audit_dialogues = new DialogueBuilder('combat_deep_audit').withDistrict('taganka')
  .addNode('intro', 'ГЛУБОКИЙ АУДИТ', 'Процесс запущен. Системные боты сканируют каждый байт вашего присутствия. Чтобы выжить — нужно взломать их логику раньше, чем они обнулят вас.', [
    { text: '[ НАЧАТЬ ВАЛИДАЦИЮ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_taganka_audit' },
    { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
  ])
  .build();
