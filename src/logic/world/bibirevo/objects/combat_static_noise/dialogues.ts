import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const combat_static_noise_dialogue: DialogueTree = new DialogueBuilder('combat_static_noise').withDistrict('bibirevo')
  .addNode('intro', 'БЕЛЫЙ ШУМ // ZONE', 'Подсеть погружена в статический шум. Видимость: 5%. Сигнал: FATAL. Что-то живет внутри этого шума, оно ловит пакеты и перемалывает их в кашу.', [
    { text: '[ ВОЙТИ В ЗОНУ ШУМА ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_static_noise' },
    { text: '[ СОХРАНИТЬ ДАННЫЕ ]', nextId: 'LEAVE' }
  ])
  .build();
