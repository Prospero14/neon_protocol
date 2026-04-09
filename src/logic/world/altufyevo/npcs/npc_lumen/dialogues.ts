import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_lumen_dialogues = new DialogueBuilder('npc_lumen').withDistrict('altufyevo')
  .withGreetings({
    neutral: ['intro'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'ЛЮМЕН', 'Я читаю улицу по мерцанию вывесок. Когда неон дергается, значит в районе кто-то правит правду. Нужна работа?', [
    { text: 'Ты правда читаешь логи по свету?', nextId: 'lore_neon' },
    { text: '[КОНТРАКТ] Диагностика ночной линии.', nextId: 'intro', awardQuestId: 'q_alt_lumen_neon_audit' },
    { text: '[КОНТРАКТ] Снять охрану с крыши.', nextId: 'intro', awardQuestId: 'q_alt_lumen_rooftop_scrim' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'ЛЮМЕН', 'Твои шаги уже в моей карте района. Могу дать более горячую задачу, если не боишься высоты.', [
    { text: '[КОНТРАКТ] Снять охрану с крыши.', nextId: 'intro', awardQuestId: 'q_alt_lumen_rooftop_scrim' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_hostile', 'ЛЮМЕН', 'С твоей репутацией даже лампы гаснут. Контрактов не будет.', [
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'ЛЮМЕН', 'У тебя шум в канале. Неон такое не любит. Вернись ровным.', [
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'ЛЮМЕН', 'Ночь идет, вывески не вечные. Если берешь задачу - береги сигнал.', [
    { text: '[КОНТРАКТ] Диагностика ночной линии.', nextId: 'intro', awardQuestId: 'q_alt_lumen_neon_audit' },
    { text: '[ Уйти ]', nextId: 'LEAVE' }
  ])
  .addLoreNode(
    'lore_neon',
    'ЛЮМЕН',
    'В старых неоновых блоках остается побочный лог: кто проходил, кто спорил, кто бежал. Я просто умею его читать. (+Intel: Neon Memory)',
    'intro',
    'Neon Memory'
  )
  .build();
