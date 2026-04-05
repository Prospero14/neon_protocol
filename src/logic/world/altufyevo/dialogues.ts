import type { DialogueTree } from '../../dialogues';
import { DialogueBuilder } from '../../dialogueUtils';

export const altufyevo_dialogues: Record<string, DialogueTree> = {
  // --- PETROVICH ---
  npc_petrovich: new DialogueBuilder('npc_petrovich')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_tutorial'],
      friendly: ['intro_friendly', 'intro_friendly_v2', 'intro_friendly_v3'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2', 'intro_repeat_v3']
    })
    .addNode('intro', 'ПЕТРОВИЧ', 'Здорово, племяш. Чинишься помаленьку?', [
      { text: 'Как дела в "Раст Валли"?', nextId: 'lore_faction' },
      { text: 'Что за Скрипты-зомби (Митино)?', nextId: 'lore_client' },
      { text: 'Ты должен знать, как тут всё устроено. (Закончить ввод)', nextId: 'quest_start_finish', requireActiveQuestId: 'q_kiddo_start' },
      { text: 'Нужна работа, дядя.', nextId: 'job_selection' },
      { text: 'По поводу Силоса №7 (Завершить зачистку)', nextId: 'quest_silo_finish', requireReadyQuestId: 'q_altufyevo_silo_clear' },
      { text: 'Тут один "грызун" из Марьино передал тебе чип...', nextId: 'quest_rogue_module_finish', requireReadyQuestId: 'q_petrovich_rogue_module' },
      { text: 'Я принес тот опечатанный архив из Выхино.', nextId: 'quest_vykhino_check', requireReadyQuestId: 'q_vykhino_delivery' },
      { text: 'Нужны запчасти для деки.', nextId: 'trade' },
      { text: 'Бывай, дядюшка.', nextId: 'farewell' }
    ])
    .addNode('job_selection', 'ПЕТРОВИЧ', 'Работы навалом, если руки из плеч. Либо Силосы зачистить, либо в Марьино за чипом сходить. Что выберешь?', [
      { text: 'Зачистить Силосы (Combat).', nextId: 'quest_explain_1' },
      { text: 'Сходить за чипом (Maryino).', nextId: 'lore_lost_module' },
      { text: 'Назад.', nextId: 'intro' }
    ])
    .addNode('intro_v2', 'ПЕТРОВИЧ', '*протирает ветошью процессор* О, живой! А я уж думал, тебя в Выхино на запчасти разобрали. Принес что-нибудь интересное?', [
      { text: 'Что за Скрипты-зомби?', nextId: 'lore_zombie' },
      { text: 'Есть посылка из Выхино.', nextId: 'quest_vykhino_check', requireReadyQuestId: 'q_vykhino_delivery' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addNode('intro_friendly_v2', 'ПЕТРОВИЧ', 'Племяш! Ты теперь в Раст Валли — свой человек. Заходи, чаю выпьем, или дело обсудим?', [
      { text: 'Есть посылка из Выхино.', nextId: 'quest_vykhino_check', requireReadyQuestId: 'q_vykhino_delivery' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addNode('intro_repeat_v2', 'ПЕТРОВИЧ', 'Снова за запчастями? Или Силосы опять фонят? В Октябре время — это Bits.', [
      { text: 'Давайте к делу.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addNode('intro_friendly', 'ПЕТРОВИЧ', 'А, наш человек! Раст Валли всегда рады таким. Есть дельце в Силосах, как раз для тебя.', [
      { text: 'Рассказывай, дядюшка.', nextId: 'quest_explain_1' },
      { text: 'Как там наши дела?', nextId: 'lore_faction' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addNode('intro_tutorial', 'ПЕТРОВИЧ', 'Ну что, решил таки делом заняться? Давай подумаем как тебя поднатаскать на что-нибудь полезное.', [
      { text: 'Да, пора начинать.', nextId: 'intro' },
      { text: 'Кто ты?', nextId: 'lore_petrovich' }
    ])
    .addNode('intro_hostile', 'ПЕТРОВИЧ', 'Ты? Я слышал, ты подпеваешь корпоратам. В Раст Валли таких не жалуют. Проваливай.', [
      { text: 'Я просто выполняю работу...', nextId: 'farewell' }
    ])
    .addNode('intro_stressed', 'ПЕТРОВИЧ', 'Ох, малец... У тебя искры из ушей. Сядь, остынь. Куда ты в таком состоянии полезешь?', [
      { text: 'Я в порядке. Что там в Силосах?', nextId: 'lore_zombie' },
      { text: '[Уйти и остыть]', nextId: 'farewell' }
    ])
    .addNode('intro_v3', 'ПЕТРОВИЧ', 'Слышь, племяш, в Октябре за бесплатно даже CRC не чекают. Чего пришел?', [
      { text: 'Покажи железо.', nextId: 'trade' },
      { text: 'Я насчет Силосов.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addNode('intro_friendly_v3', 'ПЕТРОВИЧ', 'О, стабильная сигнатура! Рад видеть, что ты еще не рассыпался на пакеты. Глянешь новые модули?', [
      { text: 'Гляну.', nextId: 'trade' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addNode('intro_hostile_v2', 'ПЕТРОВИЧ', 'Снова ты? Мои датчики уже фонят. Проваливай в свой Мейнфрейм.', [
      { text: 'Ухожу.', nextId: 'farewell' }
    ])
    .addNode('intro_stressed_v2', 'ПЕТРОВИЧ', 'Малец, ты выглядишь как битый сектор. Иди охладись в "Синем Чипе".', [
      { text: 'Ладно...', nextId: 'farewell' }
    ])
    .addNode('intro_repeat', 'ПЕТРОВИЧ', 'Снова здорово! Силосы опять забились этим цифровым мусором. Поможешь ветерану еще раз?', [
      { text: 'Конечно. Давай данные.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addNode('intro_repeat_v3', 'ПЕТРОВИЧ', 'Время — это Bits, племяш. Не стой на линии. Чего надо?', [
      { text: 'К делу.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'farewell' }
    ])
    .addLoreNode('lore_faction', 'ПЕТРОВИЧ', 'Да как... Скребем по сусекам. Мы — последние, кто помнит, как чинить вещи, а не покупать подписки.', 'intro', 'Rust Valley')
    .addLoreNode('lore_petrovich', 'ПЕТРОВИЧ', 'Я? Я видел Москву еще до "Ядра". Тогда облака были белыми, а не свинцовыми. Теперь вот — сижу на Силосах, чиню то, что корпораты считают мусором.', 'intro')
    .addLoreNode('lore_client', 'ПЕТРОВИЧ', 'Да старик один, из "Redundants". Они в Митино на старых 486-х серверах какое-то наследие хранят.', 'intro')
    .addNode('quest_explain_1', 'ПЕТРОВИЧ', 'В Силосах стоит старая стойка управления. Там завелись процессы-паразиты. Нужно вручную сбросить CRC.', [
       { text: 'А если не сброшу?', nextId: 'quest_explain_2' },
       { text: 'Я готов. Проверяй допуски.', nextId: 'rank_check' }
    ])
    .addNode('quest_explain_2', 'ПЕТРОВИЧ', 'Разнесет пол-района. Шучу. Просто Bits не получишь. Ну что, берешься?', [
      { text: 'Теперь точно готов.', nextId: 'rank_check' },
      { text: 'Страшно звучит.', nextId: 'intro' }
    ])
    .addNode('rank_check', 'ПЕТРОВИЧ', 'Ну-ка, дай гляну твою страховку... (Петрович осматривает твой ID)', [
      { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
      { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_accept', 'ПЕТРОВИЧ', 'Нормально. На, держи допуск в Силосы. Как закончишь — с меня 50 Bits на охлад.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', awardQuestId: 'q_altufyevo_silo_clear' }
    ])
    .addLoreNode('lore_zombie', 'ПЕТРОВИЧ', 'Да мусор это, остатки старых прошивок. Плодятся в пустых кластерах и жрут циклы CPU.', 'intro')
    .addNode('trade', 'ПЕТРОВИЧ', 'Смотри, что откопал сегодня. Почти не пользованные библиотеки.', [
      { text: 'SysOut Print (20 Bits)', nextId: 'intro', cost: 20, effect: 'GIVE_CARD', cardRewardId: 'fn_sysout_print' },
      { text: 'Назад', nextId: 'intro' }
    ])
    .addNode('farewell', 'ПЕТРОВИЧ', 'Иди уже. И не забудь сделать бэкап. В Октябре память — единственное, что нельзя украсть...', [
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .addNode('quest_vykhino_check', 'ПЕТРОВИЧ', 'Опа! Это блок из Выхино? Фонит-то как... Могу "отфильтровать" его — вытащить пару ценных ключей. Но Ядро может заметить.', [
        { text: 'Сдать как есть. (Стандарт)', nextId: 'quest_vykhino_finish' },
        { text: 'Отфильтровать данные. (+50 Bits, Риск)', nextId: 'quest_vykhino_filter', requireMinLevel: 4 },
        { text: 'Изучить содержимое логов. (Lore)', nextId: 'quest_vykhino_study', requireTrait: 'social_engineer' },
        { text: 'Я пока придержу его.', nextId: 'intro' }
    ])
    .addNode('quest_vykhino_filter', 'ПЕТРОВИЧ', '*ловко подключает шунт* Чик-чик, и готово. Держи лишние Bits, племяш. Но если спросят — блок пришел битым.', [
      { text: 'Понял, Петрович.', nextId: 'quest_vykhino_finish', effect: 'GIVE_BITS', amount: 50 }
    ])
    .addLoreNode('quest_vykhino_study', 'ПЕТРОВИЧ', 'Это логи перемещения Теневых Групп. Теперь ты знаешь чуть больше, чем положено. (+Intel: Shadow_Ops)', 'quest_vykhino_finish')
    .addNode('quest_vykhino_finish', 'ПЕТРОВИЧ', 'Архив в системе. Вот твоя доля за доставку (80 Bits). Можешь потратить на охлад.', [
      { text: 'Рад помочь.', nextId: 'intro', effect: 'GIVE_BITS', amount: 80, completeQuestId: 'q_vykhino_delivery' }
    ])
    .addNode('lore_lost_module', 'ПЕТРОВИЧ', 'Тс-с! "Zero-Point" — это модули из первой волны автоматизации. Говорят, Крыса-курьер в Марьино один такой припрятала.', [
      { text: 'В Марьино? Это далеко.', nextId: 'lore_lost_module_2' }
    ])
    .addNode('lore_lost_module_2', 'ПЕТРОВИЧ', 'Далековато, но игра стоит свеч. Вернешь мне чип — сделаю такой апгрейд, задымишься. На, 100 Bits авансом на такси.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_petrovich_rogue_module', effect: 'GIVE_BITS', amount: 100 }
    ])
    .addNode('quest_rogue_module_finish', 'ПЕТРОВИЧ', '(Петрович бережно берет чип) Глазам не верю... Живой! Ты настоящий техник. Как и обещал — вот тебе спец-библиотека.', [
      { text: 'Спасибо, Петрович.', nextId: 'intro', completeQuestId: 'q_petrovich_rogue_module' }
    ])
    .addNode('quest_start_finish', 'ПЕТРОВИЧ', 'Ну, раз ты добрался живым, значит драйверы в голове еще работают. Слушай, Силос №7 опять перегрет. Стая крыс-кодеров забила вентиляцию. Сходи, разберись, а я пока замолвлю за тебя словечко Варвару.', [
      { text: '[ ПРИНЯТЬ КОНТРАКТ: Силос №7 ]', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_silo_clear', completeQuestId: 'q_kiddo_start', effect: 'AWARD_QUEST', cardRewardId: 'UNLOCK_PETROVICH_HOME' }
    ])
    .addNode('quest_silo_finish', 'ПЕТРОВИЧ', 'О, шум утих! Молодца, племяш. На, держи заслуженные 50 Bits. Теперь дуй к Варвару, он просил помочь с диагностикой.', [
      { text: 'Никаких проблем, Петрович.', nextId: 'intro', effect: 'GIVE_BITS', amount: 50, completeQuestId: 'q_altufyevo_silo_clear' }
    ])
    .addNode('intro_note', 'ПЕТРОВИЧ', 'Записка на двери: Ушел в бар. Буду поздно.', [
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .build(),

  // --- VARVAR ---
  npc_varvar: new DialogueBuilder('npc_varvar')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'ВАРВАР', 'Стой! Проверка суммы... Проходи. Магнус, мой кот, заперся в Уборной №4 и активировал "Локаут". Бот считает туалет секретным объектом.', [
      { text: 'Кот заперся в туалете?', nextId: 'lore_cat' },
      { text: 'Я разберусь с этим протоколом. (Нужен 1 уровень)', nextId: 'quest_explain_1' },
      { text: 'Петрович сказал, ты можешь дать работу.', nextId: 'quest_talk' },
      { text: 'Магнус в безопасности. Локаут снят.', nextId: 'quest_magnus_finish', requireReadyQuestId: 'q_altufyevo_combat_magnus_toilet_bug_sweep' },
      { text: 'Диагностика Силоса №7 завершена.', nextId: 'quest_silo_scout_finish', requireReadyQuestId: 'q_altufyevo_silo_scout' },
      { text: 'Очистка Силоса №7 завершена (квест Петровича).', nextId: 'lore_silo_alt', requireCompletedQuestId: 'q_altufyevo_silo_clear' },
      { text: 'Кто такие Nullpointers?', nextId: 'lore_faction' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_silo_alt', 'ВАРВАР', 'Видел по логам. Чик-чик — и чисто. Петрович не врал, ты соображаешь. Теперь помоги мне с диагностикой верхних ярусов.', 'quest_talk')
    .addNode('intro_friendly', 'ВАРВАР', 'А, null-брат! Твои логи чисты. Магнус опять устроил дедлок в 4-й уборной. Бот VOSKHOD совсем озверел.', [
      { text: 'Я помогу Магнусу.', nextId: 'quest_explain_1' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile', 'ВАРВАР', 'Корпоративный шпион! Твоя сигнатура воняет Gigabank-ом. Уходи.', [
      { text: 'Я ухожу...', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'ВАРВАР', 'Твой пинг зашкаливает. Не подходи ко мне, я не хочу подцепить твой перегрев. Охладись.', [
      { text: 'Ладно...', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'ВАРВАР', 'Мы — Nullpointers. Те, кого забыли инициализировать. Код должен принадлежать всем.', 'intro', 'Nullpointers')
    .addNode('intro_v2', 'ВАРВАР', 'Поток фрагментирован... Опять ты? Что надо?', [
      { text: 'Кто такие Nullpointers?', nextId: 'lore_faction' },
      { text: 'Что там с Магнусом?', nextId: 'lore_cat' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'ВАРВАР', 'Если ты от Регуляторов — у меня авто-удаление логов настроено. Если по делу — форматни запрос.', [
      { text: 'Нужна работа.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'ВАРВАР', 'Твой хеш совпадает... Проходи к терминалу, только не трогай охлаждение. Магнус сегодня не в духе.', [
      { text: 'Понял.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile_v2', 'ВАРВАР', 'Твое присутствие вызывает утечки памяти в моем терпении. Проваливай.', [
      { text: 'Ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed_v2', 'ВАРВАР', 'У тебя критический перегрев. Ты фонишь как сломанный магнетрон. Стой на месте.', [
      { text: 'Я остыну.', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ВАРВАР', 'Зациклился? Снова за квестами? Магнус все еще ждет.', [
      { text: 'Я готов работать.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v2', 'ВАРВАР', 'Пинг... Понг... Снова ты. Либо бери контракт, либо не забивай шину данных.', [
      { text: 'Беру контракты.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_explain_1', 'ВАРВАР', 'Уборная №4 — это старый узел связи. Бот VOSKHOD решил, что мой кот — "Rootkit". Если не взломаешь очистку, Магнуса "отформатируют".', [
        { text: 'Как взломать очистку?', nextId: 'quest_explain_2' },
        { text: 'Я готов. Сканируй.', nextId: 'rank_check' }
    ])
    .addNode('quest_explain_2', 'ВАРВАР', 'Уязвимость в протоколе слива. Прямой доступ к ядру бота. Но VOSKHOD бьет током.', [
        { text: 'Вытянет. Погнали.', nextId: 'rank_check' },
        { text: 'Позже зайду.', nextId: 'intro' }
    ])
    .addNode('rank_check', 'ВАРВАР', 'Ну-ка... (Варвар подключает кабель)', [
        { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 0, isTraineeOnly: true },
        { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 1 },
        { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'ВАРВАР', 'Ха-ха! "Стажер"! Нос не дорос до моих кошек. Иди качайся.', [
        { text: 'Я вернусь.', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'ВАРВАР', 'Годится. Сопротивление в норме. Иди и верни мне Магнуса.', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', awardQuestId: 'q_altufyevo_combat_magnus_toilet_bug_sweep' }
    ])
    .addNode('quest_magnus_finish', 'ВАРВАР', 'Мур-р... Магнус на коленях, кусает кабель. Спасибо, null-брат. Вот твои 60 Bits. И не говори никому про туалет.', [
        { text: 'Всегда рад помочь коту.', nextId: 'intro', effect: 'GIVE_BITS', amount: 60, completeQuestId: 'q_altufyevo_combat_magnus_toilet_bug_sweep' }
    ])
    .addNode('quest_silo_scout_finish', 'ВАРВАР', 'Логи пришли. Температура стабилизируется... Хорошая работа. Держи 40 Bits за диагностику.', [
        { text: 'Рад помочь.', nextId: 'intro', effect: 'GIVE_BITS', amount: 40, completeQuestId: 'q_altufyevo_silo_scout' }
    ])
    .addLoreNode('lore_cat', 'ВАРВАР', 'Он не просто кот, он — ходячая уязвимость! Активировал IoT-блокировку по лапе. Система считает всех врагами.', 'intro')
    .addNode('quest_talk', 'ВАРВАР', 'Работа? Federal Oversight не погладит по головке. Нужно прозвонить железо или доставить данные. Что потянешь?', [
      { text: 'Нужна работа по сканированию Силоса.', nextId: 'quest_silo_scout_accept' },
      { text: 'Есть посылки на доставку? (После Силоса)', nextId: 'quest_backup_delivery_accept', requireCompletedQuestId: 'q_altufyevo_silo_scout' },
      { text: 'Я еще подумаю.', nextId: 'intro' }
    ])
    .addNode('quest_silo_scout_accept', 'ВАРВАР', 'Силос №7 перегрет. Нужно пропинговать порты на верхнем ярусе. Награда: 40 Bits.', [
      { text: 'Сделаю.', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_silo_scout' },
      { text: 'Нет времени.', nextId: 'intro' }
    ])
    .addNode('quest_backup_delivery_accept', 'ВАРВАР', 'Слушай, Магнус порвал кабель связи... Доставь бэкап Связисту Моне в Бибирево. Это важно для сети. Согласен?', [
      { text: 'Забираю диск. (К Моне)', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_varvar_backup', effect: 'GIVE_BITS', amount: 30 },
      { text: 'Слишком далеко.', nextId: 'intro' }
    ])
    .addNode('intro_note', 'ВАРВАР', 'Записка на двери: Прозваниваю порты на нижнем ярусе. Не входить.', [
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .build(),

  // --- NIXANNA ---
  npc_nixanna: new DialogueBuilder('npc_nixanna')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      hostile: ['intro_hostile', 'intro_hostile_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'НИКСАННА', 'Погодь, дай дорендерить... Визуализация в этом секторе просто ужас. Видишь мир в 4K или ты в 8 битах?', [
      { text: 'Кто такие Silicon Hedge?', nextId: 'lore_faction' },
      { text: 'Что за проблемы с визуализацией?', nextId: 'lore_scene' },
      { text: 'Есть работа по профилю?', nextId: 'quest_talk' },
      { text: 'Я сбросил кэш в "Ритуале". Все отрендерилось.', nextId: 'quest_ritual_finish', requireReadyQuestId: 'q_altufyevo_combat_nixanna_ritual_bug_sweep' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'НИКСАННА', 'Твоя тесселяция оставляет желать лучшего. Чего пришел? Прерывание в потоке вызываешь?', [
      { text: 'Нужна работа.', nextId: 'quest_talk' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'НИКСАННА', 'Если хочешь помочь с финальным рендером "Октября" — мы можем договориться.', [
      { text: 'Я готов помочь.', nextId: 'quest_talk' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'НИКСАННА', 'Визуальный ряд в норме! Твои правки были кинематографичны. Чем могу помочь?', [
      { text: 'Нужен патч для Чертаново.', nextId: 'quest_chertanovo_check', requireActiveQuestId: 'q_chertanovo_privacy' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'НИКСАННА', 'О, мой любимый тестер! У меня есть новый паттерн для рендеринга удачи. Хочешь?', [
      { text: 'Продолжай.', nextId: 'quest_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile', 'НИКСАННА', 'Твоя сигнатура — чистый спам. Я не общаюсь с теми, у кого такой низкий FPS в морали.', [
      { text: 'Я ухожу.', nextId: 'LEAVE' }
    ])
    .addNode('intro_hostile_v2', 'НИКСАННА', 'Ошибка 403: Доступ запрещен. Возвращайся, когда обнулишь репутацию.', [
      { text: 'Эх...', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed', 'НИКСАННА', 'Твой рендеринг подлагивает. Иди охладись, пока не вылетел в BSOD.', [
      { text: 'Понял.', nextId: 'LEAVE' }
    ])
    .addNode('intro_stressed_v2', 'НИКСАННА', 'У тебя переполнение буфера стресса. Ты баг, а не кодер. Чинись.', [
      { text: 'Ладно...', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'НИКСАННА', 'Цикл обновился. Принес образцы или просто пакеты задерживаешь?', [
      { text: 'К делу.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v2', 'НИКСАННА', 'Моя сцена не терпит повторов. Берешь контракт?', [
      { text: 'Беру.', nextId: 'quest_pitch' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_faction', 'НИКСАННА', 'Silicon Hedge считают, что реальность можно оптимизировать под прибыль. Мы — их баги.', 'intro', 'Silicon Hedge')
    .addLoreNode('lore_scene', 'НИКСАННА', 'Тут утечки памяти. Текстуры плывут. Кто-то явно сэкономил на полигонах.', 'intro')
    .addNode('quest_chertanovo_check', 'НИКСАННА', 'Снова параноики из Чертаново? Им кажется, что за ними следят чайники. Решим как-нибудь?', [
        { text: 'Ты же знаешь, я помог тебе с "Ритуалом". (Бесплатно)', nextId: 'quest_chertanovo_free', requireCompletedQuestId: 'q_altufyevo_combat_nixanna_ritual_bug_sweep' },
        { text: 'Оплатить библиотеку (80 Bits).', nextId: 'quest_chertanovo_finish', cost: 80 },
        { text: 'Предложить данные из Марьино. (Lore)', nextId: 'quest_chertanovo_lore', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 15 } },
        { text: 'Я позже зайду.', nextId: 'intro' }
    ])
    .addNode('quest_chertanovo_free', 'НИКСАННА', 'Верно, ты спас мою сцену! За это — патч за счет заведения.', [
        { text: 'Спасибо, Никсанна.', nextId: 'quest_chertanovo_finish' }
    ])
    .addNode('quest_chertanovo_lore', 'НИКСАННА', 'Данные о "Buffer Overflow Zone"? Ох, это мне и нужно! Держи патч.', [
        { text: 'Рад обмену.', nextId: 'quest_chertanovo_finish' }
    ])
    .addNode('quest_chertanovo_finish', 'НИКСАННА', 'Вот им "Privacy Patch". Скажи, пусть чистят куки и не верят `stderr`.', [
        { text: 'Заберу патч.', nextId: 'intro', effect: 'GIVE_BITS', amount: 40, completeQuestId: 'q_chertanovo_privacy' }
    ])
    .addNode('quest_talk', 'НИКСАННА', 'Работа? Мой "Ритуал" зарос багами. Нужно сбросить кэш отрисовки или заняться Академией. Выбирай.', [
        { text: 'Зачистить "Ритуал".', nextId: 'quest_pitch' },
        { text: 'Рекомендация для Академии?', nextId: 'recommend_pitch', requireCompletedQuestId: 'q_kiddo_first_bits' },
        { text: 'Я передумал.', nextId: 'intro' }
    ])
    .addNode('quest_pitch', 'НИКСАННА', 'Зайди в узел "Ритуал" и сбрось кэш. Твои логи чисты?', [
        { text: 'Чисты как слеза. Проверяй.', nextId: 'rank_check' },
        { text: 'Не сейчас.', nextId: 'intro' }
    ])
    .addNode('recommend_pitch', 'НИКСАННА', 'Академия? Архипов всё еще там сидит? Ха! Докажи, что ты талантлив, и дам образец.', [
        { text: 'Я докажу. Сканируй.', nextId: 'rank_check_recommend' },
        { text: 'Передумал.', nextId: 'intro' }
    ])
    .addNode('rank_check_recommend', 'НИКСАННА', 'Дай гляну архитектуру... (Анализ графа)', [
        { text: '[ Ждать ]', nextId: 'quest_accept_recommend', requireMinLevel: 0 },
        { text: '[ Ждать ]', nextId: 'quest_accept_recommend', isProOnly: true }
    ])
    .addNode('quest_accept_recommend', 'НИКСАННА', 'Неплохо. У тебя есть вкус. Держи образец для Архипова в Академии. Скажи — от меня.', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', awardQuestId: 'q_niksanna_recommendation' }
    ])
    .addNode('rank_check', 'НИКСАННА', 'Покажи свой волновой фронт...', [
        { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
        { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 2 },
        { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
    ])
    .addNode('quest_reject', 'НИКСАННА', 'Упс! В шейдерах ошибки. Нос не дорос до Reality Engine. Возвращайся позже.', [
        { text: 'Эх...', nextId: 'LEAVE' }
    ])
    .addNode('quest_accept', 'НИКСАННА', 'Нормально. Сигнатура сбалансирована. Иди в узел "Ритуал".', [
        { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', effect: 'AWARD_QUEST', awardQuestId: 'q_altufyevo_combat_nixanna_ritual_bug_sweep' }
    ])
    .addNode('quest_ritual_finish', 'НИКСАННА', 'О! Видишь этот свет? Вот теперь это искусство. Твои правки в коде — просто божественны. Держи 70 Bits на новую палитру.', [
        { text: 'Рад был помочь со сценой.', nextId: 'intro', effect: 'GIVE_BITS', amount: 70, completeQuestId: 'q_altufyevo_combat_nixanna_ritual_bug_sweep' }
    ])
    .addNode('intro_note', 'НИКСАННА', 'Записка на двери: Ушла в рендер. Буду когда догорит видюха.', [
        { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .build(),

  // --- TAXI ---
  term_taxi_alt: new DialogueBuilder('term_taxi_alt')
    .addNode('intro', 'ТЕРМИНАЛ_ТАКСИ', 'СИСТЕМА_ТАКСИ: Узел АЛТУФЬЕВО. Статус: Локальный карантин. Требуется разблокировка.', [
      { text: 'Ввести код доступа (500 Bits)', nextId: 'unlock_confirm', cost: 500 },
      { text: 'Использовать ваучер Петровича', nextId: 'unlock_confirm', requireQuestId: 'q_petrovich_rogue_module', subtext: 'Аванс покрывает расходы.' },
      { text: '[ВЫХОД]', nextId: 'LEAVE' }
    ])
    .addNode('unlock_confirm', 'ТЕРМИНАЛ_ТАКСИ', 'ПРОТОКОЛ_ПРИНЯТ. Маршрутизация на Марьино, Выхино и Центр открыта.', [
      { text: '[РАЗБЛОКИРОВАТЬ КАРТУ ГОРОДА]', nextId: 'LEAVE', effect: 'UNLOCK_CITY', completeQuestId: 'q_kiddo_metro_access' }
    ])
    .build(),

  // --- JOB BOARD ---
  job_board_alt: new DialogueBuilder('job_board_alt')
    .withGreetings({
      neutral: ['intro', 'intro_v2'],
      repeat: ['intro', 'intro_repeat']
    })
    .addNode('intro', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'Список активных контрактов в секторе Алтуфьево. Уведомления мерцают оранжевым.', [
      { text: '[КОНТРАКТ] Утечка в распредщите', nextId: 'job_leak_accept' },
      { text: '[КОНТРАКТ] Доставка в Сокол', nextId: 'job_sokol_accept' },
      { text: '[КОНТРАКТ] Зачистка зомби-процессов', nextId: 'job_zombie_accept' },
      { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'ДОСКА_ОБЪЯВЛЕНИЙ', '[NOTIFICATION] Обнаружен новый пакет задач. Статус сети: STABLE.', [
      { text: 'Посмотреть список.', nextId: 'intro' },
      { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'ДОСКА_ОБЪЯВЛЕНИЙ', '[RE-SCANNING] Таблица задач не изменилась. Доступны старые контракты.', [
      { text: 'Глянуть еще раз.', nextId: 'intro' },
      { text: '[ЗАКРЫТЬ]', nextId: 'LEAVE' }
    ])
    .addNode('job_leak_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'ОПИСАНИЕ: Потеря пакетов на уровне L1. ОПЛАТА: 60 Bits. [0 LVL]', [
      { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_data_leak' },
      { text: '[ ОТМЕНА ]', nextId: 'intro' }
    ])
    .addNode('job_sokol_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'ОПИСАНИЕ: Курьер в Лабораторию Сокола. Срочно. ОПЛАТА: 40 Bits. [0 LVL]', [
      { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_sokol_talk_lab_delivery' },
      { text: '[ ОТМЕНА ]', nextId: 'intro' }
    ])
    .addNode('job_zombie_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'ОПИСАНИЕ: Активность ботов в коллекторах. ТРЕБУЕТСЯ: Дефрагментация. ОПЛАТА: По тарифу.', [
      { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_kiddo_first_bits' },
      { text: '[ ОТМЕНА ]', nextId: 'intro' }
    ])
    .addNode('job_data_hunt_accept', 'ДОСКА_ОБЪЯВЛЕНИЙ', 'ОПИСАНИЕ: Замечены "битые" пакеты с инфой. Собрать и доставить. ОПЛАТА: 50 Bits.', [
      { text: '[ ПРИНЯТЬ ]', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_data_leak' },
      { text: '[ ОТМЕНА ]', nextId: 'intro' }
    ])
    .build(),

  // --- SILO TERMINAL ---
  term_silo_7: new DialogueBuilder('term_silo_7')
    .addNode('intro', 'СИЛОС_#7', '[SYSTEM_ALERT] Температура: 115°C. Ошибка контура. Сервисный лог: Нашествие вредителей ("rats").', [
      { text: 'Провести диагностику охлаждения', nextId: 'diag_finish', requireQuestId: 'q_altufyevo_silo_scout' },
      { text: '[ ЗАЧИСТКА: ВЛОМИТЬСЯ В СИСТЕМУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_silo_inner', requireQuestId: 'q_altufyevo_silo_clear' },
      { text: '[ВЫХОД]', nextId: 'LEAVE' }
    ])
    .addNode('diag_finish', 'СИЛОС_#7', '[SUCCESS] Пингую систему... Узел "Внутренний Контур" заблокирован физически. Требуется локальная зачистка.', [
      { text: '[ ЗАВЕРШИТЬ ДИАГНОСТИКУ ]', nextId: 'LEAVE', effect: 'GIVE_BITS', amount: 40 }
    ])
    .build(),

  // --- SCRAP SHOP ---
  shop_scrap: new DialogueBuilder('shop_scrap')
    .withGreetings({
      neutral: ['intro', 'intro_v2', 'intro_v3', 'intro_v4'],
      friendly: ['intro_friendly', 'intro_friendly_v2'],
      stressed: ['intro_stressed', 'intro_stressed_v2'],
      repeat: ['intro_repeat', 'intro_repeat_v2']
    })
    .addNode('intro', 'СЕРЫЙ', 'Эй, кодер! Ищешь что-то по дешёвке? У меня есть чипсеты "невозможные".', [
      { text: 'Как движется торговля?', nextId: 'lore_trade' },
      { text: 'Есть работа?', nextId: 'quest_scrap_accept' },
      { text: 'Процессоры "Восход" у меня.', nextId: 'quest_scrap_finish', requireReadyQuestId: 'q_altufyevo_scrap_hunt' },
      { text: '[УЙТИ]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_trade', 'СЕРЫЙ', 'Да как... Свалка — это жизнь. Корпораты выбрасывают, мы подбираем. Главное — чтобы "Восход" не накрыл. (+Intel: Scrap_Market)', 'intro')
    .addNode('intro_v4', 'СЕРЫЙ', 'В порту пусто, на полках — хлам. Принес что-нибудь стоящее?', [
      { text: 'Покажи, что есть.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v2', 'СЕРЫЙ', 'Bits в руки — товар в деку. Никаких возвратов. Заходи.', [
      { text: 'Нужна работа.', nextId: 'quest_scrap_accept' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_v3', 'СЕРЫЙ', 'Трафик густой... Кто-то уронил шлюз в Марьино. Пингуешь мою полку?', [
      { text: 'Гляну.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly', 'СЕРЫЙ', 'О, лучший клиент! Для тебя у меня всегда есть "белые" логи. Заходи.', [
      { text: 'Что есть?', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_friendly_v2', 'СЕРЫЙ', 'Сигнализация на тебе не орет? Отлично. Глянь завоз из Свалки.', [
      { text: 'Гляну.', nextId: 'intro' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat', 'СЕРЫЙ', 'Снова ты? Бери контракт или покупай что-нибудь.', [
      { text: 'Беру квест.', nextId: 'quest_scrap_accept' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('intro_repeat_v2', 'СЕРЫЙ', 'Цикл за циклом... Тебе все еще нужны процессоры "Восход"?', [
      { text: 'Иду за ними.', nextId: 'quest_scrap_accept' },
      { text: '[Уйти]', nextId: 'LEAVE' }
    ])
    .addNode('quest_scrap_accept', 'СЕРЫЙ', 'Мне нужны процессоры от ботов "Восход". Они дикие на Свалке. Принеси пару — дам 100 Bits.', [
      { text: 'Договорились.', nextId: 'LEAVE', awardQuestId: 'q_altufyevo_scrap_hunt' },
      { text: 'Слишком опасно.', nextId: 'intro' }
    ])
    .addNode('quest_scrap_finish', 'СЕРЫЙ', 'Они самые! Жаркие, шумные, идеальные. Держи свои 100 Bits. Приходи еще, Свалка большая.', [
        { text: 'Удачи с товаром.', nextId: 'intro', effect: 'GIVE_BITS', amount: 100, completeQuestId: 'q_altufyevo_scrap_hunt' }
    ])
    .addNode('intro_note', 'СЕРЫЙ', 'Записка на двери: Ушел пропивать выручку. Заходи завтра.', [
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .build(),

  // --- BLUE CHIP BAR ---
  bar_chips: new DialogueBuilder('bar_chips')
    .addNode('intro', 'СИНИЙ ЧИП', 'Запах дешевого озона и перегретого пластика. Единственное место в Алтуфьево, где можно охладить нейроны без риска подцепить вирус.', [
      { text: 'Заказать охладитель (25 Bits, -15 Stress)', nextId: 'intro', cost: 25, effect: 'RESTORE_HP', amount: 15 },
      { text: 'Синтетический кофе (10 Bits, -5 Stress)', nextId: 'intro', cost: 10, effect: 'RESTORE_HP', amount: 5 },
      { text: 'Послушать сплетни (5 Bits)', nextId: 'lore_bar', cost: 5 },
      { text: '[Подойти к Декеру на пенсии]', nextId: 'bar_decker_intro' },
      { text: '[Подсесть к Нервному Клиенту]', nextId: 'bar_client_intro' },
      { text: '[Отдать данные Клиенту]', nextId: 'bar_client_finish', requireReadyQuestId: 'q_bar_copy_logs' },
      { text: '[УЙТИ]', nextId: 'LEAVE' }
    ])
    .addLoreNode('lore_bar', 'БАРМЕН', 'Говорят, в Силосе №12 вчера видели кого-то из "Элиты". Искали старые бэкапы... Странно это.', 'intro')
    // Old Decker Branch
    .addNode('bar_decker_intro', 'СТАРЫЙ ДЕКЕР', '*Он механически помешивает синтетический джин.* Эх, молодежь... Вы думаете, что Сеть всегда была такой? С этими вашими ICE и корпоративными прокси? В мое время TCP-пакеты летали свободно, как птицы.', [
      { text: 'Расскажи про корпоративные войны.', nextId: 'bar_decker_lore_wars' },
      { text: 'Оставить старика в покое.', nextId: 'intro' }
    ])
    .addLoreNode('bar_decker_lore_wars', 'СТАРЫЙ ДЕКЕР', 'Когда произошел Раскол, "Элита" просто переписала протоколы маршрутизации под себя. Они закрыли Верхний Уровень и оставили нас копаться в этом мусоре. Будь осторожен там... Ядро следит за каждым твоим PING-ом. (+Intel: Network_History)', 'intro')
    // Nervous Client Branch
    .addNode('bar_client_intro', 'НЕРВНЫЙ КЛИЕНТ', '*Он постоянно оглядывается и теребит край куртки.* Ты... ты ведь занимаешься "грязной" работой? Мне нужно, чтобы кто-то скачал одни удаленные логи с Удаленного Прокси. Я хорошо заплачу.', [
      { text: 'В чем подвох?', nextId: 'bar_client_explain' },
      { text: 'Не интересует.', nextId: 'intro' }
    ])
    .addNode('bar_client_explain', 'НЕРВНЫЙ КЛИЕНТ', 'Подвох в том, что система мониторит трафик. **Обязательно нужно соблюсти алгоритмическую цепочку (Execution Chain).** Слушай внимательно: мне нужно, чтобы ты проник в лог-архив (карточка `ls`), нашел строки с моим профилем (карточка `grep`) и тихо выгрузил их мне на сервер (карточка `scp`). Никаких лишних действий, не перепутай порядок, иначе сработает сигнализация.', [
      { text: 'Понял: ls, затем grep, затем scp. Берусь.', nextId: 'LEAVE', awardQuestId: 'q_bar_copy_logs' },
      { text: 'Слишком сложно.', nextId: 'intro' }
    ])
    .addNode('bar_client_finish', 'НЕРВНЫЙ КЛИЕНТ', 'Ты сделал это?! *Он судорожно проверяет данные на дата-паде.* Да, это они... Мои логи из Бибирево... Спасибо! Держи оплату.', [
      { text: 'Всегда к вашим услугам.', nextId: 'intro', effect: 'GIVE_BITS', amount: 150, completeQuestId: 'q_bar_copy_logs' }
    ])
    .build(),

  // --- COMBAT NODES (Hard Audit Pass) ---
  combat_nixanna_ritual: new DialogueBuilder('combat_nixanna_ritual')
    .addNode('intro', 'РИТУАЛ // АЛГОРИТМ', 'Перед тобой мерцает узел "Ритуал". Никсанна говорит, что здесь ломается реальность. Сетчатка глаза фиксирует артефакты рендеринга.', [
      { text: '[ ПОДКЛЮЧИТЬСЯ К УЗЛУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_nixanna_ritual' },
      { text: '[ ОТКЛЮЧИТЬСЯ ]', nextId: 'LEAVE' }
    ])
    .build(),

  combat_magnus_toilet: new DialogueBuilder('combat_magnus_toilet')
    .addNode('intro', 'УБОРНАЯ №4 // LOCKOUT', 'Дверь заблокирована. Бот VOSKHOD яростно мигает красным. Слышно приглушенное мяуканье Магнуса.', [
      { text: '[ ВЗЛОМАТЬ ЗАМОК ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_magnus_toilet' },
      { text: '[ ОТСТУПИТЬ ]', nextId: 'LEAVE' }
    ])
    .build(),

  combat_rats: new DialogueBuilder('combat_rats')
    .addNode('intro', 'КАБЕЛЬНЫЙ КАНАЛ №12', 'Здесь темно и пахнет жженой изоляцией. Десятки маленьких красных диодов смотрят на тебя из темноты. Крысы-кодеры защищают свою территорию.', [
      { text: '[ ИНИЦИИРОВАТЬ ЗАЧИСТКУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_rats' },
      { text: '[ УЙТИ ]', nextId: 'LEAVE' }
    ])
    .build(),

  combat_silo_inner: new DialogueBuilder('combat_silo_inner')
    .addNode('intro', 'ВНУТРЕННИЙ КОНТУР', 'Сердце промышленного массива. Здесь хранятся архивы протоколов. Система безопасности Силоса активирована.', [
      { text: '[ ВЛОМИТЬСЯ В СИСТЕМУ ]', nextId: 'LEAVE', effect: 'START_COMBAT', cardRewardId: 'combat_silo_inner' },
      { text: '[ ОТОЙТИ ОТ ТЕРМИНАЛА ]', nextId: 'LEAVE' }
    ])
    .build(),
};
