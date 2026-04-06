import type { WorldDistrict } from '../types';
import { npc_professor_profile } from './npcs/npc_professor/profile';
import { npc_professor_dialogues } from './npcs/npc_professor/dialogues';
import { npc_compiler_profile } from './npcs/npc_compiler/profile';
import { npc_compiler_dialogues } from './npcs/npc_compiler/dialogues';
import { npc_alumini_profile } from './npcs/npc_alumini/profile';
import { npc_alumini_dialogues } from './npcs/npc_alumini/dialogues';

import { uni_moscow_dialogues } from './objects/uni_moscow/dialogues';
import { shop_edu_addons_dialogues } from './objects/shop_edu_addons/dialogues';
import { term_library_dialogues } from './objects/term_library/dialogues';
import { term_main_frame_dialogues } from './objects/term_main_frame/dialogues';
import { bar_scholar_dialogues } from './objects/bar_scholar/dialogues';
import { combat_academic_guard_dialogues } from './objects/combat_academic_guard/dialogues';
import { combat_virus_lab_dialogues } from './objects/combat_virus_lab/dialogues';
import { term_taxi_south_west_dialogues } from './objects/term_taxi_south_west/dialogues';

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
        { id: 'combat_virus_lab', name: 'Вирусная Лаборатория', type: 'combat', description: 'Экспериментальные инфекции софта.', x: 25, y: 90 },
        { id: 'term_taxi_south_west', name: 'Такси: Юго-Западная', type: 'terminal', description: 'Вылет в город.', x: 50, y: 95 }
    ]
  },
  npcs: [
    npc_professor_profile,
    npc_compiler_profile,
    npc_alumini_profile
  ],
  dialogues: {
    npc_professor: npc_professor_dialogues,
    npc_compiler: npc_compiler_dialogues,
    npc_alumini: npc_alumini_dialogues,
    uni_moscow: uni_moscow_dialogues,
    shop_edu_addons: shop_edu_addons_dialogues,
    term_library: term_library_dialogues,
    term_main_frame: term_main_frame_dialogues,
    bar_scholar: bar_scholar_dialogues,
    combat_academic_guard: combat_academic_guard_dialogues,
    combat_virus_lab: combat_virus_lab_dialogues,
    term_taxi_south_west: term_taxi_south_west_dialogues
  }
};
