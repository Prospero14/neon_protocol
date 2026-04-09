import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_ghost_server_dialogues = new DialogueBuilder('npc_ghost_server').withDistrict('sokolniki')
  .addNode('intro', 'ПРИЗРАК_СЕРВЕРНОЙ', '...Ч... Читаю... Сектор 0xFF... Данные повреждены. (Мигает красным) ПОМОГИТЕ... МНЕ... вспомнить... КТО_Я?', [
    { text: 'Кто ты?', nextId: 'lore_origin' },
    { text: 'Попробовать стабилизировать поток (Техника)', nextId: 'branch_tech_1' },
    { text: 'Проще тебя стереть и забыть. (Удаление)', nextId: 'branch_combat_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('lore_origin', 'ПРИЗРАК_СЕРВЕРНОЙ', 'Я был Архивариус_Бетта. Библиотека Октября, 2072. Silicon Hedge хотел объединить сознание... Но произошел сбой.', [
    { text: 'Я помогу тебе вспомнить.', nextId: 'intro' },
    { text: 'Это звучит как приговор.', nextId: 'intro' }
  ])
  .addNode('branch_tech_1', 'ПРИЗРАК_СЕРВЕРНОЙ', 'Твоя дека... частота синхронна. Если замкнешь цепь — я восстановлюсь. Но твой CPU... он выдержит?', [
    { text: '[ ИНИЦИИРОВАТЬ СТАБИЛИЗАЦИЮ ]', nextId: 'branch_tech_check', requireMinLevel: 5 },
    { text: 'Я не рискну железом.', nextId: 'intro' }
  ])
  .addNode('branch_tech_check', 'ПРИЗРАК_СЕРВЕРНОЙ', '[SUCCESS] П... Процессы замедлились. Я вижу свет. Спасибо, кодер. Код спас остатки моей души. Возьми фрагмент ключа.', [
    { text: 'Рад помочь. (Завершить)', nextId: 'LEAVE', completeQuestId: 'q_sokolniki_haunted_logs', effect: 'GIVE_CARD', cardRewardId: 'fn_archival_access' }
  ])
  .addNode('branch_combat_start', 'ПРИЗРАК_СЕРВЕРНОЙ', '[WARNING] ЗАЩИТА ВКЛЮЧЕНА. Голограмма рвётся в красный шум — как старый терминал в аду. Если хочешь добить коррупцию в логах: смотри дерево (ls), выцепи строку (grep), сотри след (wash_logs), добей хвост (rm). Без порядка он просто перезагрузится и снова завизжит.', [
    { text: '[ УНИЧТОЖИТЬ КОРРУПЦИЮ ]', nextId: 'LEAVE', awardQuestId: 'q_sokolniki_combat_fox_virus_bug_sweep' }
  ])
  .build();
