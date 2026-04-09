import { DialogueBuilder } from '../../../../dialogueUtils';

export const shop_edu_addons_dialogues = new DialogueBuilder('shop_edu_addons').withDistrict('south_west')
  .addNode('intro', 'МОДУЛИ ЗНАНИЙ+', 'Продвинутые курсы и карты-скрипты для тех, кто хочет подняться выше уровня Junior.', [
    { text: 'Курс: Junior Java Vanilla (500 Bits)', nextId: 'intro', cost: 500, effect: 'GIVE_CARD', cardRewardIds: [
       'syntax_class_decl', 'syntax_method_decl', 'syntax_if', 'syntax_elseif',
       'syntax_foreach', 'syntax_try_catch', 'syntax_return_true', 'syntax_return_false',
       'fn_sysout_print', 'fn_set_add', 'fn_set_contains', 'syntax_set_init'
    ] },
    { text: 'Algorithm V2 (100 Bits)', nextId: 'intro', cost: 100, effect: 'GIVE_CARD', cardRewardId: 'fn_grep_recursive' },
    { text: 'Stack Insight (150 Bits)', nextId: 'intro', cost: 150, effect: 'GIVE_TRAIT', cardRewardId: 'neural_sync_junkie' },
    { text: 'Пакет «Фокус» — расходники (45)', nextId: 'intro', cost: 45, awardItemId: 'itm_synth_coffee', subtext: '+ кофе для ночных сессий' },
    { text: 'Пакет «Фокус+» (85)', nextId: 'intro', cost: 85, awardItemId: 'itm_neural_salve', subtext: 'Мазь после зачётов.' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .build();
