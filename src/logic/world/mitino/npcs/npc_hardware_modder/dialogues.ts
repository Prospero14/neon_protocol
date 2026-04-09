import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_hardware_modder_dialogues = new DialogueBuilder('npc_hardware_modder').withDistrict('mitino')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ФЛЭШ', 'Разрыв! Твой кулер захлебывается! Хочешь разогнать деку до предела или просто греешь воздух?', [
    { text: 'Дядя Ваня просил детали для реле.', nextId: 'quest_mod_start', requireQuestId: 'q_mitino_radio_relay' },
    { text: 'Мне нужны Bits.', nextId: 'quest_debt_start' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ФЛЭШ', 'О, мастер-оверклокер! Твоя дека теперь работает быстрее, чем пульс у стажера. Есть еще безумные идеи?', [
    { text: 'Выкладывай.', nextId: 'intro' }
  ])
  .addNode('intro_repeat', 'ФЛЭШ', 'Снова за деталями? Помни: перегрев — это смерть.', [
    { text: 'Помню.', nextId: 'intro' }
  ])
  .addNode('quest_mod_start', 'ФЛЭШ', 'Ваня... Ладно. Но модули "Turbo-X" просто так не валяются. Нужно протестировать мой новый патч на свалке. Продержишься 3 цикла?', [
    { text: 'Легко. Давай патч.', nextId: 'quest_mod_accept' },
    { text: 'Я подумаю.', nextId: 'intro' }
  ])
  .addNode('quest_mod_accept', 'ФЛЭШ', 'Держи. Если дека не сгорит — детали твои. Встретимся в зоне "Скрап".', [
    { text: '[ ПРИНЯТЬ ТЕСТЫ ]', nextId: 'LEAVE', awardQuestId: 'q_mitino_hardware_mod' }
  ])
  .addNode('quest_debt_start', 'ФЛЭШ', 'Bits? Ха! У меня самого пустые логи. Я задолжал Барыге Мише 200 Bits. Помоги вернуть долг или отработай его на свалке.', [
    { text: 'Я поговорю с Мишей.', nextId: 'quest_debt_accept' },
    { text: 'Сам разбирайся.', nextId: 'intro' }
  ])
  .addNode('quest_debt_accept', 'ФЛЭШ', 'Удачи. Он не любит ждать. Если не договоришься — он спустит на меня утилизаторов.', [
    { text: '[ ПРИНЯТЬ: ДОЛГИ МИТИНО ]', nextId: 'LEAVE', awardQuestId: 'q_mitino_debt' }
  ])
  .build();
