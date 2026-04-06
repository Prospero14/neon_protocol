import { DialogueBuilder } from '../../../../dialogueUtils';

export const term_main_frame_dialogues = new DialogueBuilder('term_main_frame', 'intro')
  .addNode('intro', 'УЗЕЛ: МЕЙНФРЕЙМ', '[AUTO_DEFENSE] Доступ ограничен. Требуется авторизация ACADEMIC.', [
    { text: '[ Попытаться авторизоваться ]', nextId: 'rank_check' },
    { text: '[Выйти]', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'УЗЕЛ: МЕЙНФРЕЙМ', '[SCANNING...] Анализ волнового лога... Сверка прав доступа...', [
    { text: '[ Ожидание ]', nextId: 'access_denied', requireMaxLevel: 2, isTraineeOnly: true },
    { text: '[ Ожидание ]', nextId: 'access_granted', requireMinLevel: 3 },
    { text: '[ Ожидание ]', nextId: 'access_granted', isProOnly: true }
  ])
  .addNode('access_denied', 'УЗЕЛ: МЕЙНФРЕЙМ', '[ERROR] Недостаточный уровень прав. Доступ заблокирован. Охрана района оповещена.', [
    { text: 'Черт...', nextId: 'LEAVE' }
  ])
  .addNode('access_granted', 'УЗЕЛ: МЕЙНФРЕЙМ', '[SUCCESS] Доступ разрешен. Ожидание команд по очистке узла от багов.', [
    { text: '[ Начать очистку (Combat) ]', nextId: 'LEAVE', awardQuestId: 'q_south_west_combat_academic_guard_bug_sweep' }
  ])
  .build();
