import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_void_link_dialogue: DialogueTree = new DialogueBuilder('term_void_link')
  .addNode('intro', 'ЛИНК_В_ПУСТОТУ', '[DENIED] Нужен доступ уровня NULLPOINTERS. Ваша Репутация: НИЖЕ 50. Только избранные могут видеть теневые репозитории.', [
    { text: 'Взломать (50%)', nextId: 'hack', requireTrait: 'social_engineer' },
    { text: 'Войти официально', nextId: 'access', requireReputation: { factionId: 'ANARCHO_VOID', minPoints: 50 } },
    { text: '[Выход]', nextId: 'LEAVE' }
  ])
  .addNode('hack', 'ЛИНК_В_ПУСТОТУ', '[OK] ДОБРО_ПОЖАЛОВАТЬ_В_DARKNET. Обнаружен несанкционированный бонус. Начать выгрузку?', [
    { text: 'Забрать Bits (50)', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 50 }
  ])
  .addNode('access', 'ЛИНК_В_ПУСТОТУ', 'ПРИВЕТСТВУЕМ, NULL_POINTER. Доступ ко всем репозиториям открыт. Сигнал очищен. Заберите награду.', [
    { text: 'Забрать софт "Wash Logs"', nextId: 'LEAVE', effect: 'GIVE_CARD', cardRewardId: 'fn_wash_logs' }
  ])
  .build();
