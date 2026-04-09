import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_old_admin_dialogue: DialogueTree = new DialogueBuilder('npc_old_admin').withDistrict('bibirevo')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'СТАРЫЙ АДМИН', 'Помню я... телнет, модемы... Вы, молодежь, даже не знаете, что такое ждать подгрузки. Свобода была до Ядра.', [
    { text: 'Рассказать о прошлом.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'СТАРЫЙ АДМИН', '*глядит в пустую консоль* Раньше мир не рендерился — мы его представляли. А сейчас? Глитчи, артефакты, Ядро... Шаг вправо, шаг влево — и ты стерт из кэша.', [
    { text: 'Что ты помнишь?', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'СТАРЫЙ АДМИН', 'А, ценитель старой школы! Откопал архивный узел... хочешь послушать историю?', [
    { text: 'Конечно.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'СТАРЫЙ АДМИН', 'Молодчина, юнит. Помогаешь Моню держать в узде — это благородно. Но настоящую свободу можно найти только в пустоте между строками кода...', [
    { text: 'Объясни.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'СТАРЫЙ АДМИН', '*не поднимает глаз* Вижу в твоем логе следы Восхода. Порядок... Контроль... Ты пахнешь несвободой. Отойди, не мешай мне дефрагментировать память.', [
    { text: 'Но я здесь!', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'СТАРЫЙ АДМИН', '*тяжело вздыхает* Твоя дека дрожит. Это не перегрев, это душа Октября пытается вырваться. Садись, отдохни... Прежде чем Ядро тебя "оптимизирует".', [
    { text: 'Я еще постою.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'СТАРЫЙ АДМИН', 'Снова в архивах? История — вечный цикл, парень. Ты уже знаешь многое, но Ядро знает больше. Береги свой CRC.', [
    { text: 'Продолжай.', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore', 'СТАРЫЙ АДМИН', 'Мы сами строили свои домены. Имя нам было — Анархисты. Теперь мы лишь тени в кэше. (+10 Репутации Анархистов)', 'intro', 'ANARCHISTS')

  .build();
