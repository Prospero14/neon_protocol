export interface NpcProfile {
  id: string;
  name: string;
  districtId: string;
  role: string;
  greeting: string;
  shortLore: string;
}

export const NPC_LIBRARY: NpcProfile[] = [
  { id: 'npc_petrovich', name: 'Петрович', districtId: 'altufyevo', role: 'Техник', greeting: 'Плату в руки и не дыши.', shortLore: 'Чинит железо за уважение и биты.' },
  { id: 'npc_varvar', name: 'Варвар', districtId: 'altufyevo', role: 'Хакер-отшельник', greeting: 'Сначала проверка CRC, потом разговор.', shortLore: 'Специалист по низкоуровневому доступу.' },
  { id: 'npc_nixanna', name: 'Никсанна', districtId: 'altufyevo', role: 'Геймдизайнер', greeting: 'Баланс не баг, баланс - религия.', shortLore: 'Дает сложные боевые поручения.' },
  { id: 'job_board_alt', name: 'Доска Объявлений', districtId: 'altufyevo', role: 'Контракт-хаб', greeting: 'Берешь контракт - доводи до результата.', shortLore: 'Быстрые pre-class задачи.' },
  { id: 'npc_grey', name: 'Грей', districtId: 'vykhino', role: 'Гоп-хакер', greeting: 'Метро - это мой VPN.', shortLore: 'Добывает маршруты и токены прохода.' },
  { id: 'npc_job_boss', name: 'Фиксер Батя', districtId: 'vykhino', role: 'Фиксер', greeting: 'Работа грязная, оплата чистая.', shortLore: 'Раздает высокодоходные контракты.' },
  { id: 'npc_tanya', name: 'Тетя Таня', districtId: 'maryino', role: 'QA', greeting: 'Если не сломалось, значит тест плохой.', shortLore: 'Дает тест-квесты и стабилизацию.' },
  { id: 'npc_zero', name: 'Z3R0', districtId: 'chertanovo', role: 'Анархист', greeting: 'Null есть истина.', shortLore: 'Квесты с риском и большим RNG.' },
  { id: 'npc_ripper_jax', name: 'Риппер Джакс', districtId: 'chertanovo', role: 'Риппердок', greeting: 'Импланты больно, но эффективно.', shortLore: 'Обменивает лут на бусты.' },
  { id: 'npc_professor', name: 'Профессор Архипов', districtId: 'south_west', role: 'Наставник', greeting: 'Класс начинается с main.', shortLore: 'Ведет к профессии Java Junior.' },
  { id: 'npc_ranger', name: 'Егерь', districtId: 'teply_stan', role: 'SRE-патруль', greeting: 'Стабильность - это дисциплина.', shortLore: 'Боевые зачистки и ремонт.' },
  { id: 'npc_master', name: 'Мастер Верстак', districtId: 'izmailovo', role: 'Крафтер', greeting: 'Из лома делаем легенды.', shortLore: 'Крафтовые контракты и добыча.' },
  { id: 'npc_signalman', name: 'Связист Моня', districtId: 'bibirevo', role: 'Связист', greeting: 'Линия живая? Тогда живем.', shortLore: 'Сетевые сервисные задания.' },
  { id: 'job_board_bibi', name: 'Инфо-панель', districtId: 'bibirevo', role: 'Контракты', greeting: 'Север не спит.', shortLore: 'Быстрые районные квесты.' },
  { id: 'npc_vlad', name: 'Влад-Ткач', districtId: 'tekstilschiki', role: 'Инженер защит', greeting: 'Плетем защиту, а не сказки.', shortLore: 'Квесты на реактивные карты защиты.' },
  { id: 'job_board_tekstil', name: 'Узел Текстильщики', districtId: 'tekstilschiki', role: 'Контракты', greeting: 'Заказы на чистку ждут.', shortLore: 'Линейка боевых поручений.' },
  { id: 'npc_marina', name: 'Марина', districtId: 'perovo', role: 'Архивариус', greeting: 'Логи помнят все.', shortLore: 'Квесты расследований и доставки.' },
  { id: 'job_board_perovo', name: 'Столб объявлений', districtId: 'perovo', role: 'Контракты', greeting: 'Нужны быстрые руки и чистый код.', shortLore: 'Череда pre-class задач.' },
  { id: 'npc_dean', name: 'Декан Техникума', districtId: 'sokol', role: 'Академия', greeting: 'Диплом не спасает от багов.', shortLore: 'Высокоуровневые учебные контракты.' },
  { id: 'npc_besm', name: 'Генерал БЭСМ', districtId: 'vdnkh', role: 'Легенда', greeting: 'Память длиннее ваших релизов.', shortLore: 'Исторические и редкие квесты.' },
  { id: 'npc_hermit', name: 'Отшельник', districtId: 'sokolniki', role: 'Лесной админ', greeting: 'Тишина лечит stack overflow.', shortLore: 'Глубокие риск-квесты.' },
  { id: 'npc_kosmos', name: 'Космос', districtId: 'fili', role: 'SRE Nomad', greeting: 'Запуск без логов - самоубийство.', shortLore: 'Spring и high-tier задания.' },
  { id: 'npc_auditor', name: 'Инквизитор', districtId: 'taganka', role: 'Аудитор ядра', greeting: 'Сначала отчёт, потом доступ.', shortLore: 'Проверяет зрелость игрока.' },
  { id: 'npc_informant', name: 'Информатор М.', districtId: 'taganka', role: 'Посредник', greeting: 'Тайны продаются поминутно.', shortLore: 'Квесты с редким лутом.' },
  { id: 'npc_mentor', name: 'Ментор курсов', districtId: 'mitino', role: 'Spring Mentor', greeting: 'Контроллер без теста - миф.', shortLore: 'Финальные pre-mid контракты.' },
];

export const getNpcById = (id: string) => NPC_LIBRARY.find((n) => n.id === id);
