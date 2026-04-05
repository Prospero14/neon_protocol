import type { NpcProfile } from '../types';

export const chertanovo_npcs: NpcProfile[] = [
  { id: 'npc_zero', name: 'Z3R0', districtId: 'chertanovo', role: 'Анархист', greeting: 'Null есть истина... Поток должен быть свободен.', shortLore: 'Лидер секты Nullpointers. Считает, что Ядро — это вирус, а ошибки — единственный путь к свободе от индексации.', factionId: 'NULLPOINTERS' },
  { id: 'npc_chertanovo_paranoid', name: 'Параноик', districtId: 'chertanovo', role: 'Резидент', greeting: 'Тихо! Твои пакеты светятся... Они знают, что ты здесь.', shortLore: 'Разработчик Privacy-стека. Его код настолько скрытен, что он сам иногда забывает, как он работает.', factionId: 'NULLPOINTERS' },
  { id: 'npc_ripper_jax', name: 'Риппер Джакс', districtId: 'chertanovo', role: 'Риппердок', greeting: 'Вшиваю функционал, вырезаю слабость. Готов к апгрейду?', shortLore: 'Бывший хирург элитных подразделений Gigabank. Теперь лечит тех, кого его бывшие хозяева списали в утиль.', factionId: 'NET_DRIVERS' },
  { id: 'npc_glitch', name: 'Глюк', districtId: 'chertanovo', role: 'Нищий', greeting: 'Stack... Overflow... Помоги... дописать...', shortLore: 'Легендарный программист, чей разум "рассыпался" после неудачной попытки взлома глубокой сети. Живой памятник рекурсии.', factionId: 'NULLPOINTERS' },
  { id: 'npc_scrap_dealer', name: 'Торговец Шламом', districtId: 'chertanovo', role: 'Торговец', greeting: 'Скупаю мусор, продаю надежду на Bits.', shortLore: 'Старьевщик, который находит ценности в том, что другие считают невосстановимыми ошибками.', factionId: 'NULLPOINTERS' },
];
