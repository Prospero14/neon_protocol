import { DialogueBuilder } from '../../../../dialogueUtils';

export const uni_moscow_dialogues = new DialogueBuilder('uni_moscow').withDistrict('south_west')
  .addNode('intro', 'УНИВЕРСИТЕТ ЮГО-ЗАПАДА', 'Добро пожаловать в архив знаний. Здесь вы оформляете допуски профессии и покупаете библиотечные модули под выбранный стек.', [
    { text: 'Получить профессию: Java Junior Developer (220 Bits)', nextId: 'intro', cost: 220, effect: 'SET_PROFESSION', cardRewardId: 'java_jun', requireCompletedQuestId: 'q_trainee_exam_practice' },
    { text: 'Купить module: LIST_ARRAYLIST (80 Bits)', nextId: 'intro', cost: 80, effect: 'GIVE_CARD', cardRewardId: 'syntax_list_init', requireCompletedQuestId: 'q_trainee_exam_theory' },
    { text: 'Купить module: STREAM_API (120 Bits)', nextId: 'intro', cost: 120, effect: 'GIVE_CARD', cardRewardId: 'mid_stream_init', requireCompletedQuestId: 'q_trainee_exam_practice' },
    { text: 'Купить module: STREAM_FILTER (130 Bits)', nextId: 'intro', cost: 130, effect: 'GIVE_CARD', cardRewardId: 'mid_stream_filter', requireCompletedQuestId: 'q_trainee_exam_practice' },
    { text: 'Купить module: STREAM_COLLECT (130 Bits)', nextId: 'intro', cost: 130, effect: 'GIVE_CARD', cardRewardId: 'mid_stream_collect', requireCompletedQuestId: 'q_trainee_exam_practice' },
    { text: 'Купить module: TRY_CATCH (95 Bits)', nextId: 'intro', cost: 95, effect: 'GIVE_CARD', cardRewardId: 'syntax_try_catch', requireCompletedQuestId: 'q_trainee_exam_theory' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
