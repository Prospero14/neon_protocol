import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_dean_dialogue: DialogueTree = new DialogueBuilder('npc_dean')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ДЕКАН_КОЛЛЕДЖА', 'Нужна работа, стажер? В EU Syntax требуются практики для стабилизации авионики. Авиация Москвы не прощает небрежности в типизации данных. Понимаешь ответственность?', [
    { text: 'Процедура аккредитации (Профессия)', nextId: 'accreditation_pitch' },
    { text: 'Кто такие "EU Syntax"?', nextId: 'lore_faction' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ДЕКАН_КОЛЛЕДЖА', '*анализирует телеметрию дронов* Еще один абитуриент в моем бэклоге... Твой стек выглядит "сырым". Хочешь привести его в соответствие с нашими стандартами?', [
    { text: 'Да, я готов к сертификации.', nextId: 'accreditation_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'ДЕКАН_КОЛЛЕДЖА', 'Системный шум в этом районе зашкаливает. Нам нужны те, кто может писать лаконично и без сайд-эффектов. Ты из таких?', [
    { text: 'Я пишу чистый код.', nextId: 'intro' },
    { text: 'Я учусь.', nextId: 'intro' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ДЕКАН_КОЛЛЕДЖА', 'А, сертифицированный специалист! Рад видеть чистые логи в твоем интерфейсе. Слышал, твой отчет по рою дронов стал эталонным для новичков.', [
    { text: 'Покажите программы.', nextId: 'accreditation_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'ДЕКАН_КОЛЛЕДЖА', 'Дорогой коллега! Вижу, ваш стек расширился... Илья говорит, вы отлично справились с методичками. Продолжим обучение или всё ещё отдыхаете в "Пропеллере"?', [
    { text: 'Продолжим.', nextId: 'accreditation_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ДЕКАН_КОЛЛЕДЖА', '[SCAN_ERROR] Твоя сигнатура полна деструктивных паттернов. В EU Syntax нет места для Nullpointers-кода. Проваливай из Сокола, пока я не аннулировал твои временные допуски.', [
    { text: 'Я исправлюсь.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ДЕКАН_КОЛЛЕДЖА', 'У вас критический уровень системного шума. Джиттер зашкаливает. В небе нет места для таких лагов. Отдохните в "Пропеллере", промойте соты охлаждения.', [
    { text: 'Я в порядке.', nextId: 'intro' },
    { text: 'Хорошо.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ДЕКАН_КОЛЛЕДЖА', 'Снова за лицензией? Помните главное правило EU Syntax: сначала — тесты, потом — деплой. Готов обновить свои системные допуски?', [
    { text: 'Готов.', nextId: 'accreditation_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore_faction', 'ДЕКАН_КОЛЛЕДЖА', 'EU Syntax — это архитекторы точности. Мы курируем критические системы города и обучаем тех, кто будет управлять инфраструктурой Москвы после "Восхода".', 'intro', 'EU Syntax')

  // === ACCREDITATION ===
  .addNode('accreditation_pitch', 'ДЕКАН_КОЛЛЕДЖА', 'Выбирай свой путь с полной ответственностью. Обучение в Колледже — это инвестиция в твою стабильность. Что ты планируешь администрировать?', [
    { text: 'Запросить: Профессия "Системный Администратор" (200 Bits)', nextId: 'ok', cost: 200, effect: 'SET_PROFESSION', awardQuestId: 'q_sokol_sysadmin_certification', requireMinLevel: 5 },
    { text: 'Запросить: Профессия "QA Тестировщик" (180 Bits)', nextId: 'ok', cost: 180, effect: 'SET_PROFESSION', awardQuestId: 'q_sokol_qa_certification', requireMinLevel: 5 },
    { text: 'Где найти продвинутые библиотеки?', nextId: 'lore_libraries', requireReputation: { factionId: 'EU_SYNTAX', minPoints: 20 } },
    { text: 'Я еще не определился.', nextId: 'intro' }
  ])
  .addLoreNode('lore_libraries', 'ДЕКАН_КОЛЛЕДЖА', 'Ищете знания? Наши коллеги из Академии (Юго-Запад) хранят архивы Collections и Streams. Но если вам нужен Spring — ищите фанатиков из Silicon Hedge в Измайлово. Мы здесь работаем с Native-кодом.', 'intro')

  .addNode('ok', 'ДЕКАН_КОЛЛЕДЖА', 'Корочка готова. Теперь ты в системе официально. Работай честно, техник. Помни: любая ошибка в авионике может стать последней для всего сегмента.', [
    { text: 'Спасибо, Декан.', nextId: 'LEAVE' }
  ])

  .build();
