import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_ranger_dialogues = new DialogueBuilder('npc_ranger')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })
  .addNode('intro', 'ЕГЕРЬ', 'Стоять. Лес — территория SRE-патруля под эгидой Federal Oversight. Здесь мы ловим баги, а не туристов. Чего хотел? Твой стек выглядит неподготовленным.', [
    { text: 'Кто такие Federal Oversight?', nextId: 'lore_faction' },
    { text: 'Нужна работа по зачистке Леса.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ЕГЕРЬ', '*проверяет излучатель* Еще один гость. В Теплом Стане мы не любим шумных прерываний. Ты уважаешь тишину логов или плодишь мусор в памяти?', [
    { text: 'Я за чистый код.', nextId: 'quest_explain_1' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ЕГЕРЬ', 'А, мастер-отладчик. Рад видеть чистую сигнатуру SRE. В 5-м секторе опять прорастает дикий код. Поможешь?', [
    { text: 'Я в деле, Егерь.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_friendly_v2', 'ЕГЕРЬ', 'А, мой лучший следопыт. Лес сегодня поет в унисон с твоим кодом. Есть одно особое место...', [
    { text: 'Где именно?', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_hostile', 'ЕГЕРЬ', 'Твоя сигнатура — критическая ошибка. Покинь периметр, пока я не вызвал группу очистки.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'ЕГЕРЬ', 'Твои логи шумят как сухая листва. Ты в стрессе, патрульный. Сходи в "Тень Леса" — остынь.', [
    { text: 'Ладно.', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'ЕГЕРЬ', 'Снова в рейд? Циклы-паразиты не ждут. Готов?', [
    { text: 'Всегда готов.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_repeat_v2', 'ЕГЕРЬ', 'Твой отчет по зачистке был безупречен. Продолжим патрулирование?', [
    { text: 'Давай данные.', nextId: 'quest_explain_1' }
  ])
  .addLoreNode('lore_faction', 'ЕГЕРЬ', 'Federal Oversight — щит Москвы. Мы блюдем закон Ядра там, где начинается хаос дикого кода. (+Intel: Federal Oversight)', 'intro', 'Federal Oversight')
  .addNode('quest_explain_1', 'ЕГЕРЬ', 'В чаще зародился рекурсивный цикл-паразит. Вытягивает Bits из локальных узлов. Нужно провести "Hard Reset". Как будешь работать?', [
    { text: 'Прямая зачистка (Бой).', nextId: 'quest_explain_2' },
    { text: 'Изолировать цикл (Technical).', nextId: 'quest_tech_path', requireMinLevel: 3 },
    { text: 'Использовать допуск SRE (Social).', nextId: 'quest_social_path', requireReputation: { factionId: 'FEDERAL_OVERSIGHT', minPoints: 15 } }
  ])
  .addNode('quest_explain_2', 'ЕГЕРЬ', 'Дикий код принял форму химер. У них нет логики. Бей их по портам. Рискнешь железом?', [
    { text: 'Проверяй маску.', nextId: 'rank_check' },
    { text: 'Надо подготовиться.', nextId: 'intro' }
  ])
  .addNode('quest_tech_path', 'ЕГЕРЬ', 'Хочешь "Signal Scrubber"? Если сможешь гасить всплески удаленно — бой не понадобится. Но нужно быстрое прерывание.', [
    { text: 'Сканируй.', nextId: 'rank_check' }
  ])
  .addNode('quest_social_path', 'ЕГЕРЬ', 'Репутация SRE дает доступ к периметру. Химеры увидят в тебе "своего". Готов?', [
    { text: 'Да. Проверяй.', nextId: 'rank_check' }
  ])
  .addNode('rank_check', 'ЕГЕРЬ', 'Дай гляну страховку... (Тяжелый системный взгляд...)', [
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ЕГЕРЬ', 'Отказ. Логи — сплошные пустые указатели. Нос не дорос до настоящего Леса. Возвращайся позже.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ЕГЕРЬ', 'Годится. Пинги чистые, сигнатура охотника. Сходи и прерви цикл, пока он не сожрал район.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ: ОХОТА ]', nextId: 'LEAVE', awardQuestId: 'q_teply_stan_combat_forest_hunt_bug_sweep' }
  ])
  .build();
