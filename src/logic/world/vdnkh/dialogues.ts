import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const vdnkh_dialogues: Record<string, DialogueTree> = {
  // --- GENERAL BESM (VOSKHOD LEADER) ---
  npc_besm: new DialogueBuilder('npc_besm')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2', 'intro_friendly_v3'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2', 'intro_repeat_v3']
    })
    .addNode('intro', 'ГЕНЕРАЛ_БЭСМ', '...Загрузка протокола 1974... Юнит, ты в зоне исторического резонанса. Я — Генерал БЭСМ, страж Voskhod. Зачем тревожишь спящую память?', [
      { text: 'Кто такие Voskhod?', nextId: 'lore_faction' },
      { text: 'Я пришел сдать Экзамен Стажёра.', nextId: 'quest_explain_1' },
      { text: 'Мне нужен винтажный софт.', nextId: 'vintage_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ГЕНЕРАЛ_БЭСМ', '...Циклы ожидания завершены. Твой стек кажется современным. Слишком много абстракций. Ты пришел заземлить свой код?', [
      { text: 'Кто такие Voskhod?', nextId: 'lore_faction' },
      { text: 'Я пришел за аттестацией.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_friendly', 'ГЕНЕРАЛ_БЭСМ', '...Приветствие подтверждено. Ты ценишь фундамент Москвы. Pavilion Zero открыт. Твой код резонирует con архивами.', [
      { text: 'Рад это слышать.', nextId: 'quest_explain_1' }
    ])
    .addNode('intro_hostile', 'ГЕНЕРАЛ_БЭСМ', '[ERROR] Твой код полон неуважения. Ты — анти-паттерн. Покинь зону, пока я не вызвал ретро-вирус 1.0.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'ГЕНЕРАЛ_БЭСМ', 'Твой стек вибрирует. Критическая частота ошибок. Ступай к Олегу, заземлись его чаем.', [
      { text: 'Я справлюсь.', nextId: 'intro' }
    ])
    .addLoreNode('lore_faction', 'ГЕНЕРАЛ_БЭСМ', 'Voskhod — память Москвы. Мы фундамент. Когда Ядро рухнет под тяжестью мусора, Voskhod останется. (+Intel: Voskhod)', 'intro', 'Voskhod')
    .addNode('quest_explain_1', 'ГЕНЕРАЛ_БЭСМ', 'Твой финальный экзамен — Pavilion Zero. Там заперт бот "Аврора" на Java 1.0. Победи его в честном бою прерываний.', [
      { text: 'Почему "Аврора" так опасна?', nextId: 'quest_explain_2' },
      { text: 'Проверяй аттестат.', nextId: 'exam_rank_check' }
    ])
    .addNode('quest_explain_2', 'ГЕНЕРАЛ_БЭСМ', 'У неё нет лишнего веса в коде. Только логика и скорость. Провалишь пакет — экзамен провален. Идешь?', [
      { text: 'Я готов.', nextId: 'exam_rank_check' },
      { text: 'Надо подумать.', nextId: 'intro' }
    ])
    .addNode('vintage_pitch', 'ГЕНЕРАЛ_БЭСМ', 'Винтаж... Мои драйверы рассыпались. Найди Скупщика в Измайлово. Ему нужно "Legacy Core 1974". Готов к проверке?', [
        { text: 'Моя воля крепка. Проверяй.', nextId: 'vintage_rank_check' },
        { text: 'Я еще подумаю.', nextId: 'intro' }
    ])
    .addNode('vintage_rank_check', 'ГЕНЕРАЛ_БЭСМ', '...Считывание сигнатуры... Сравнение con эталоном 1970-го года...', [
        { text: '[ Ждать ]', nextId: 'vintage_reject', requireMaxLevel: 3, isTraineeOnly: true },
        { text: '[ Ждать ]', nextId: 'vintage_accept', requireMinLevel: 4 },
        { text: '[ Ждать ]', nextId: 'vintage_accept', isProOnly: true }
    ])
    .addNode('vintage_reject', 'ГЕНЕРАЛ_БЭСМ', 'Отказ. Разум замусорен фреймворками. Не удержишь структуру 1974-го. Нос не дорос! Возвращайся позже.', [
        { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('vintage_accept', 'ГЕНЕРАЛ_БЭСМ', '...Допуск подтвержден. Найди Скупщика в Измайлово и принеси мне ядро. Я вознагражу тебя знаниями. (Принять контракт)', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_besm_vintage_code' }
    ])
    .addNode('exam_rank_check', 'ГЕНЕРАЛ_БЭСМ', '...Проверка учебного плана... Анализ боевых логов...', [
        { text: '[ Ждать ]', nextId: 'exam_reject', requireMaxLevel: 4 },
        { text: '[ Ждать ]', nextId: 'exam_accept', requireMinLevel: 5, isTraineeOnly: true },
        { text: '[ Ждать ]', nextId: 'exam_accept', isProOnly: true }
    ])
    .addNode('exam_reject', 'ГЕНЕРАЛ_БЭСМ', 'Допуск аннулирован. Уровень (Ниже 5) недостаточен. Сначала заверши поручения в других округах.', [
        { text: 'Я понял.', nextId: 'LEAVE' }
    ])
    .addNode('exam_accept', 'ГЕНЕРАЛ_БЭСМ', 'Протокол "Аттестация" активирован. Порази Тренировочного Бота в главном павильоне. Удачи, юнит. (Принять Экзамен)', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ: ЭКЗАМЕН ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', cardRewardId: 'q_trainee_exam_practice' }
    ])
    .build(),

  // --- RAISA (GUIDE) ---
  npc_guide_vdnkh: new DialogueBuilder('npc_guide_vdnkh')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro', 'intro_repeat']
    })
    .addNode('intro', 'ГИД_РАИСА', 'Здесь был первый мейнфрейм "Раздача". Хотите узнать о золотом веке советского кода?', [
        { text: 'Расскажите о павильонах.', nextId: 'lore' },
        { text: 'Связист из Бибирево жалуется на эхо...', nextId: 'quest_echo_check', requireQuestId: 'q_monya_signal_echo' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore', 'ГИД_РАИСА', 'Павильон "Космос" теперь — серверный массив. А "Земледелие" — ферма для древних алгоритмов. (+5 Репутации Voskhod)', 'intro', 'Voskhod', { effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'VOSKHOD_OFFICE' })
    .addNode('quest_echo_check', 'ГИД_РАИСА', 'Эхо? Это ретрансляторы в подвалах Pavilion #32. Передают новости Олимпиады-80. Нужно согласование. Как договоримся?', [
        { text: 'Оплатить расходы (40 Bits).', nextId: 'quest_echo_finish', cost: 40 },
        { text: 'Помогу конспектом (Lore).', nextId: 'quest_echo_lore', requireReputation: { factionId: 'VOSKHOD_OFFICE', minPoints: 20 } },
        { text: 'Прозвоню узел сам (Technical).', nextId: 'quest_echo_tech', requireMinLevel: 3 },
        { text: 'Я подумаю.', nextId: 'intro' }
    ])
    .addNode('quest_echo_lore', 'ГИД_РАИСА', 'Вы глубоко знаете историю Voskhod! Ваши данные о "Мир-1" неоценимы. Дам ключи бесплатно.', [
      { text: 'Рад помочь.', nextId: 'quest_echo_finish' }
    ])
    .addNode('quest_echo_tech', 'ГИД_РАИСА', 'Сами? Подвалы Pavilion #32 сильно фонят. Но если принесете отчет — дам Jammer.', [
      { text: 'Сделаю.', nextId: 'quest_echo_finish' }
    ])
    .addNode('quest_echo_finish', 'ГИД_РАИСА', 'Вот, передай Моне этот "Frequency Jammer". Пусть Бибирево спит спокойно.', [
        { text: 'Спасибо, передам.', nextId: 'intro', effect: 'COMPLETE_TALK_QUEST', cardRewardId: 'q_monya_signal_echo' }
    ])
    .build(),

  // --- OLEG (TEA MASTER) ---
  npc_tea_master: new DialogueBuilder('npc_tea_master')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'МАСТЕР_ЧАЯ_ОЛЕГ', 'Сядь. Выпей чаю. CPU перегрет, стек забит. Дзен-ЦОД — это баланс. Дай системе отдохнуть.', [
        { text: 'Сонный Кодер из Бибирево просил "Дзен-Лог".', nextId: 'quest_energy_give', requireQuestId: 'q_bibirevo_energy' },
        { text: 'Чашка "Дзен-Лога" (Бесплатно)', nextId: 'intro', effect: 'RESTORE_HP', amount: 10 },
        { text: 'Кто такие "Дзен-ЦОД"?', nextId: 'lore_faction' },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_energy_give', 'МАСТЕР_ЧАЯ_ОЛЕГ', 'Сонный? Он совсем зациклился... На, держи настойку на старых логах. Пусть выпьет залпом. И скажи — пусть поспит.', [
        { text: 'Спасибо, Олег. Передам.', nextId: 'intro', effect: 'GIVE_BITS', amount: 20 }
    ])
    .addLoreNode('lore_faction', 'МАСТЕР_ЧАЯ_ОЛЕГ', 'Дзен-ЦОД — фракция тех, кто устал от гонки Ядра. Мы верим: идеальный код — это его отсутствие. (+Intel: Дзен-ЦОД)', 'intro', 'Zen-DC')
    .build(),

  // --- SCAVENGER ---
  npc_scavenger: new DialogueBuilder('npc_scavenger')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly'],
      hostile: ['intro_hostile'],
      stressed: ['intro_stressed'],
      repeat: ['intro_repeat']
    })
    .addNode('intro', 'СТЕРВЯТНИК', 'Нашел кластеры в Pavilion #5. Хочешь купить? Или продаешь?', [
        { text: 'Продать скрап (15 Bits)', nextId: 'intro', effect: 'GIVE_BITS', amount: 15 },
        { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .build(),
};
