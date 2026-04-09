import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_mentor_dialogues = new DialogueBuilder('npc_mentor').withDistrict('mitino')
  .addNode('intro', 'МЕНТОР_КУРСОВ', 'Времени мало, кода много. Интенсивы "JetBrain-Zero" — твой единственный шанс не сгнить стажером. Какой стек прошиваем?', [
    { text: 'Проверить мои допуски на обучение.', nextId: 'rank_check' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('rank_check', 'МЕНТОР_КУРСОВ', 'Дай гляну базу... Мы не учим тех, кто не умеет пинговать реальность. (Ментор сканирует твой опыт...)', [
    { text: '[ Ждать ]', nextId: 'reject', requireMaxLevel: 4, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'ok_to_learn', requireMinLevel: 5 },
    { text: '[ Ждать ]', nextId: 'ok_to_learn', isProOnly: true }
  ])
  .addNode('reject', 'МЕНТОР_КУРСОВ', 'Малец, ты серьезно? Тебе еще в Академии парты протирать. Нос не дорос до интенсивов! Набей 5-й уровень, тогда и поговорим.', [
    { text: 'Я вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('ok_to_learn', 'МЕНТОР_КУРСОВ', 'База есть. Можем начинать. Выбирай направление:', [
    { text: 'Класс: Kotlin Developer (350 Bits)', nextId: 'bought', cost: 350, effect: 'SET_PROFESSION', cardRewardId: 'kotlin_jun' },
    { text: 'Класс: Go Developer (400 Bits)', nextId: 'bought', cost: 400, effect: 'SET_PROFESSION', cardRewardId: 'go_jun' },
    { text: 'Класс: JS Developer (250 Bits)', nextId: 'bought', cost: 250, effect: 'SET_PROFESSION', cardRewardId: 'js_jun' },
    { text: 'Назад', nextId: 'intro' }
  ])
  .addNode('bought', 'МЕНТОР_КУРСОВ', 'Теперь ты в элите. Иди и пиши так, чтобы Ядро лагало от зависти.', [
    { text: 'Лечу!', nextId: 'LEAVE' }
  ])
  .build();
