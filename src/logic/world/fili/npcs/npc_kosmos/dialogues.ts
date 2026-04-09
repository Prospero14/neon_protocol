import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_kosmos_dialogues = new DialogueBuilder('npc_kosmos').withDistrict('fili')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro'],
    stressed: ['intro'],
    repeat: ['intro', 'intro_v2']
  })
  .addNode('intro', 'КОСМОС', 'Эй, земной! Видел, как горят серверные стойки в Фили? Я собираю экспедицию на орбиту... цифровой реальности. Поможешь?', [
    { text: 'Больные фантазии?', nextId: 'lore' },
    { text: 'Нужна работа.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'КОСМОС', '*смотрит в пустое небо* Видишь эти пиксели? Это битые сектора Ядра. Мы должны подняться выше. У тебя есть допуск к аплинку?', [
    { text: 'Кто ты такой?', nextId: 'lore' },
    { text: 'Я за работой.', nextId: 'quest_pitch' }
  ])
  .addNode('intro_friendly', 'КОСМОС', 'Астро-брат! Твоя сигнатура светится как сверхновая. Готов к очередному затяжному прыжку в код?', [
    { text: 'Готов, Космос.', nextId: 'quest_pitch' }
  ])
  .addLoreNode('lore', 'КОСМОС', 'Это не фантазии. Мы — в симуляции. Единственный выход — через черный ход в облако Ядра. Ты же не хочешь всю жизнь дебажить ошибки в Малом Сити?', 'intro')
  .addNode('quest_pitch', 'КОСМОС', 'Нужны топливные стержни... Сходи к Пусковой Стойке. У стражей там суровые скрипты защиты. Твоя дека выдержит прозвон?', [
    { text: 'Я готов к запуску. Проверяй.', nextId: 'rank_check' },
    { text: 'Не сейчас.', nextId: 'intro' }
  ])
  .addNode('rank_check', 'КОСМОС', 'Дай гляну сигнатуру... (Быстро пролистывает твои боевые логи...)', [
    { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 5, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 6 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'КОСМОС', 'Ха-ха! Да ты еще стажёр. Код развалится при первой же перегрузке. Нос не дорос до орбиты! Возвращайся на 6-м уровне.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'КОСМОС', 'Впечатляет. У тебя есть потенциал. Контракт твой. Сходи к стойке и принеси мне стержни. (Принять контракт)', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ: АПЛИНК ]', nextId: 'LEAVE', awardQuestId: 'q_fili_combat_launch_guard_bug_sweep' }
  ])
  .build();
