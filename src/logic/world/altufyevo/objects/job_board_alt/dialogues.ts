import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const job_board_alt_dialogue: DialogueTree = new DialogueBuilder('job_board_alt').withDistrict('altufyevo')
  .addNode('intro', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'СЕВЕРНЫЕ_СИЛОСЫ // очередь: 104. ДОСТУП: открыт. Контракты синхронизированы с узлами района — читай строку «клиент», не путай с личной инициативой.', [
    { text: 'Сокол → Академия: методички (лаборант Илья)', nextId: 'job_delivery_accept' },
    { text: 'Силос 7: теплосъём (заказчик: Варвар)', nextId: 'job_zombie_accept' },
    { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
  ])
  .addNode('job_delivery_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'Маршрут: Сокол (лаборатория) → Юго-Запад (Академия), получатель — Туранов. Пакет помечен EU Syntax. Оплата по факту у Ильи; доска только фиксирует очередь.', [
    { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_talk_lab_delivery' }
  ])
  .addNode('job_zombie_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'Силос 7: перегрев в коллекторах, Варвару нужен снимок с терминала глубины до того, как литейку задраят по приказу. Консоль всё ещё отвечает — успеть.', [
    { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_silo_scout' }
  ])
  .build();
