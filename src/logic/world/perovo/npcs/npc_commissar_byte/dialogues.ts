import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_commissar_byte_dialogues = new DialogueBuilder('npc_commissar_byte')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'КОМИССАР_БАЙТ', 'Слышишь гул? Это голос угнетенных пакетов. В Перово каждый бит принадлежит народу, а не Gigabank. Ты с нами?', [
    { text: 'Кто такие "Киберкоммисы"?', nextId: 'lore' },
    { text: 'Я за народ. Как помочь?', nextId: 'quest_explain_1' },
    { text: 'Распределение трафика.', nextId: 'quest_distro_accept' },
    { text: 'Трафик перенаправлен.', nextId: 'quest_distro_finish', requireQuestId: 'q_perovo_communitarian_distro' },
    { text: 'Подготовка к стачке.', nextId: 'quest_strike_accept' },
    { text: 'Терминал Бригадира заблокирован.', nextId: 'quest_strike_finish', requireQuestId: 'q_perovo_factory_strike' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'КОМИССАР_БАЙТ', '*протирает шеврон* Дека эффективна. Но служит ли делу равенства или копит Bits в частных ячейках?', [
    { text: 'Ищу путь к равенству.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_friendly', 'КОМИССАР_БАЙТ', 'Приветствую, техник! Твои заслуги в реестре почета. Готов к новой экспроприации корпоративного кода?', [
    { text: 'Всегда готов!', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_hostile', 'КОМИССАР_БАЙТ', 'Твои логи пропитаны корпоративным подкупом. Здесь не место для наймитов GigaBank. Уходи, пока народ не вынес тебе вердикт.', [
    { text: 'Я ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'КОМИССАР_БАЙТ', 'Слишком много паники в твоем стеке. Революция требует холодного расчета, а не перегретых процессоров. Остынь и возвращайся.', [
    { text: 'Я в норме. Дай работу.', nextId: 'quest_explain_1' }
  ])
  .addNode('intro_repeat', 'КОМИССАР_БАЙТ', 'Старое неравенство всё еще в силе. Конвои GigaBank продолжают сосать кровь из района. Сделаем еще один проход по их маршрутам?', [
    { text: 'Сделаем.', nextId: 'quest_explain_1' }
  ])
  .addLoreNode('lore', 'КОМИССАР_БАЙТ', 'Мы — KyberCommis. Верим в децентрализацию Ядра. Боремся против монополий за право на свободный стек. (+Intel: Киберкоммисы)', 'intro', 'KyberCommis')
  .addNode('quest_explain_1', 'КОМИССАР_БАЙТ', 'Gigabank везет данные о долгах района через шлюз №4. Нужно перехватить и "дефрагментировать". Порядок критичен: сначала найди реестр (ls), отфильтруй записи (grep) и примени команду полного удаления (rm). Сделаем народ свободным?', [
    { text: 'Прямой перехват (Бой).', nextId: 'quest_explain_2' },
    { text: 'Запоминаю: ls, grep, rm. Я за дело.', nextId: 'rank_check' }
  ])
  .addNode('quest_explain_2', 'КОМИССАР_БАЙТ', 'Конвой охранят боты-регуляторы. Это битва за биты. Запомни пайплайн: Найти (ls), Выделить (grep), Смыть (rm). Уверен?', [
    { text: 'Уверен. Проверяй.', nextId: 'rank_check' },
    { text: 'Надо подумать.', nextId: 'intro' }
  ])
  .addNode('rank_check', 'КОМИССАР_БАЙТ', 'Дай гляну социальный индекс... (Изучает логи соединения...)', [
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 0 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'КОМИССАР_БАЙТ', 'Товарищ... логи слабы. Не выдержишь натиска корпоративных демонов. Набери опыта в Хабе.', [
    { text: 'Вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'КОМИССАР_БАЙТ', 'Вижу огонь в транзисторах. Контракт твой. Верни Bits народу! (Принять контракт: ЭКСПРОПРИАЦИЯ)', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_perovo_combat_commissar_redistribution' }
  ])
  .addNode('quest_distro_accept', 'КОМИССАР_БАЙТ', 'Gigabank зарезервировал полосу для "платных логов". Сбрось квоты в роутере. Плачу 50 Bits.', [
    { text: 'Я перенастрою.', nextId: 'LEAVE', awardQuestId: 'q_perovo_communitarian_distro' }
  ])
  .addNode('quest_distro_finish', 'КОМИССАР_БАЙТ', 'Народ теперь смотрит новости без лагов! Герой цифрового фронта. Держи заслуженные 50 Bits.', [
    { text: 'Служу народу.', nextId: 'intro', effect: 'GIVE_BITS', amount: 50, completeQuestId: 'q_perovo_communitarian_distro' }
  ])
  .addNode('quest_strike_accept', 'КОМИССАР_БАЙТ', 'Стачка близка. Заблокируй терминал Бригадира — и завод встанет. Оплата 100 Bits. Рискнешь?', [
    { text: 'Заблокирую.', nextId: 'LEAVE', awardQuestId: 'q_perovo_factory_strike' }
  ])
  .addNode('quest_strike_finish', 'КОМИССАР_БАЙТ', 'Линии остановились! Бригадир в ярости, рабочие свободны. Вот твоя доля — 100 Bits.', [
    { text: 'Ура.', nextId: 'intro', effect: 'GIVE_BITS', amount: 100, completeQuestId: 'q_perovo_factory_strike' }
  ])
  .build();
