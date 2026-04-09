import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_guide_vdnkh_dialogue: DialogueTree = new DialogueBuilder('npc_guide_vdnkh').withDistrict('vdnkh')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ГИД РАИСА', 'Тихо... Слышите? Это гул первого мейнфрейма "Раздача". Добро пожаловать на ВДНХ. Хотите узнать о золотом веке советского кода?', [
    { text: 'Расскажите о павильонах.', nextId: 'lore' },
    { text: 'Связист из Бибирево жалуется на эхо...', nextId: 'quest_echo_check', requireQuestId: 'q_monya_signal_echo' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ГИД РАИСА', 'Посмотрите налево — здесь была серверная "Земледелие". Сейчас тут пустота, но в логах до сих пор растут призрачные урожаи. Хотите взглянуть?', [
    { text: 'Что это значит?', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'ГИД РАИСА', 'Выглядите как человек, который ценит чистую архитектуру. Пришли на экскурсию или ищете "Vintage" библиотеки?', [
    { text: 'Экскурсия.', nextId: 'intro' },
    { text: 'Ищу библиотеки.', nextId: 'lore' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ГИД РАИСА', 'О, наш почетный гость! Вижу, вы не просто юзер, а настоящий исследователь систем. Хотите заглянуть за "железный занавес" Pavilion Zero?', [
    { text: 'С удовольствием.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ГИД РАИСА', '[WARNING] Твой тип данных не соответствует стандартам Voskhod. Слишком много "Null" в твоем волноводе. Сгинь!', [
    { text: 'Я ухожу.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ГИД РАИСА', 'Твой CPU греется сильнее, чем старый БЭСМ-6. Остынь, иначе твои логи станут частью моей экспозиции "Ошибки Рендеринга".', [
    { text: 'Хорошо.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ГИД РАИСА', 'Тот Jammer в Бибирево — это был исторический артефакт. Надеюсь, Моня не сломал его. Ищете новые данные?', [
    { text: 'Ищу.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_monya_signal_echo' })

  // === LORE ===
  .addLoreNode('lore', 'ГИД РАИСА', 'Павильон "Космос" теперь — огромный серверный массив. А в "Подмосковье" до сих пор живут призраки старых BBS. (+5 Репутации Voskhod)', 'intro', 'Voskhod', { effect: 'GIVE_REPUTATION', amount: 5, cardRewardId: 'VOSKHOD_OFFICE' })

  // === QUESTS ===
  .addNode('quest_echo_check', 'ГИД РАИСА', 'Эхо? Это ретрансляторы в подвалах Pavilion #32. Передают новости Олимпиады-80 в бесконечном цикле. Нужно согласование, чтобы отключить их. Как договоримся?', [
    { text: 'Оплатить расходы (40 Bits).', nextId: 'quest_echo_finish', cost: 40 },
    { text: 'Я знаю всю историю Voskhod! (Lore)', nextId: 'quest_echo_lore', requireReputation: { factionId: 'VOSKHOD_OFFICE', minPoints: 20 } },
    { text: 'Я сам прозвоню узел. (Technical)', nextId: 'quest_echo_tech', requireMinLevel: 3 },
    { text: 'Я еще подумаю.', nextId: 'intro' }
  ])
  .addNode('quest_echo_lore', 'ГИД РАИСА', 'Вы цитируете манифест "Мир-1"! Впечатляюще. Ваши данные неоценимы для архива. Дам ключи бесплатно.', [
    { text: 'Рад помочь.', nextId: 'quest_echo_finish' }
  ])
  .addNode('quest_echo_tech', 'ГИД РАИСА', 'Хотите рискнуть? Подвалы Pavilion #32 сильно фонят. Но если принесете отчет о помехах — я дам Jammer.', [
    { text: 'Договорились.', nextId: 'quest_echo_finish' }
  ])
  .addNode('quest_echo_finish', 'ГИД РАИСА', 'Вот, передайте Моне этот "Frequency Jammer". Пусть Бибирево спит спокойно, пока мы храним прошлое.', [
    { text: 'Спасибо, передам.', nextId: 'intro', effect: 'GIVE_BITS', amount: 20, completeQuestId: 'q_monya_signal_echo' }
  ])

  .build();
