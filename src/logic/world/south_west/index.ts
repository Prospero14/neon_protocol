import type { WorldDistrict } from '../types';
import { south_west_npcs } from './npcs';
import { south_west_dialogues } from './dialogues';

export const south_west: WorldDistrict = {
  id: 'south_west', 
  node: {
    id: 'south_west', 
    name: 'SOUTH_WEST: ACADEMIC_UPLINK', 
    description: 'Район институтов и наукоградов. Здесь витает дух старой академии и нелегальных серверов.', 
    x: 15, y: 65, stability: 95, type: 'hub', tier: 1,
    subNodes: [
        { id: 'npc_professor', name: 'Профессор Архипов', type: 'npc', description: 'Преподает фундаментальную Java. Верит в чистый код.', x: 30, y: 20 },
        { id: 'npc_compiler', name: 'Компилятор (Фанатик)', type: 'npc', description: 'Одержим оптимизацией байт-кода. Резок и точен.', x: 10, y: 60 },
        { id: 'npc_alumini', name: 'Беглый Выпускник', type: 'npc', description: 'Выжил после релиза в GIGA_BANK. Ищет убежище.', x: 60, y: 15 },
        { id: 'uni_moscow', name: 'Университет Юго-Запада', type: 'shop', description: 'Легальное обучение и библиотеки.', x: 50, y: 40 },
        { id: 'shop_edu_addons', name: 'Модули Знаний+', type: 'shop', description: 'Продвинутые курсы и карты-скрипты.', x: 80, y: 30 },
        { id: 'term_library', name: 'Библиотека Кода', type: 'terminal', description: 'Доступ к архивам Java и истории языков.', x: 70, y: 70 },
        { id: 'term_main_frame', name: 'Узел: МЕЙНФРЕЙМ', type: 'terminal', description: 'Центральный вычислитель района. Слишком защищен.', x: 90, y: 50 },
        { id: 'bar_scholar', name: 'Рюмочная "Студент"', type: 'bar', description: 'Здесь пьют горький кофе и пишут диплом.', x: 15, y: 40 },
        { id: 'combat_academic_guard', name: 'Академическая Охрана', type: 'combat', description: 'Автоматические системы защиты данных.', x: 40, y: 80 },
        { id: 'combat_virus_lab', name: 'Вирусная Лаборатория', type: 'combat', description: 'Экспериментальные инфекции софта.', x: 25, y: 90 }
    ]
  },
  npcs: south_west_npcs,
  dialogues: south_west_dialogues
};
