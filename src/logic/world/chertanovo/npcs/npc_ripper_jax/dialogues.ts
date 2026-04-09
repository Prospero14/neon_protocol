import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_ripper_jax_dialogue: DialogueTree = new DialogueBuilder('npc_ripper_jax').withDistrict('chertanovo')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'РИППЕР ДЖАКС', 'Хочешь быстрый апгрейд? Вшиваю архитектуру и девопс за один сеанс. Грязновато, но чертовски эффективно в этом Гетто.', [
    { text: 'Мне нужна новая "прошивка" личности. (Профессия)', nextId: 'trade_pitch' },
    { text: 'Кто ты такой?', nextId: 'lore' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'РИППЕР ДЖАКС', '*стерилизует скальпель* Твой нынешний стек хрупкий. Один хедшот Ядра — и ты овощ. Укрепимся? В Чертаново нет страховки, только патчи.', [
    { text: 'Что предлагаешь?', nextId: 'trade_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'РИППЕР ДЖАКС', 'Либо ты быстрый, либо ты донор для старых мейнфреймов. Апгрейд стоит Bits, но окупается в первом же рейде. Готов?', [
    { text: 'Готов.', nextId: 'trade_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'РИППЕР ДЖАКС', 'А, мой любимый подопытный! Вижу, мой чип работает без сбоев. Нужна коррекция или еще один слой логики?', [
    { text: 'Показывай апгрейды.', nextId: 'trade_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'РИППЕР ДЖАКС', 'Твоя нервная система адаптировалась быстрее, чем я думал. Есть пара экспериментальных библиотек для твоего стека.', [
    { text: 'Интересно.', nextId: 'trade_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'РИППЕР ДЖАКС', '*не поднимает глаз* Я не оперирую "стукачей". В твоих портах пахнет протоколами GigaBank. Проваливай, пока я не вскрыл твой кэш бесплатно.', [
    { text: 'Я сам по себе.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'РИППЕР ДЖАКС', '*хмурится* У тебя... серьезное выгорание нейронов. Еще один такт в таком режиме — и твой интерфейс посыпется. Остынь, кодер.', [
    { text: 'Мне нужен апгрейд.', nextId: 'trade_pitch' },
    { text: 'Пойду остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'РИППЕР ДЖАКС', 'Снова на столе? Чип прижился, но мир вокруг не стал стабильнее. Чем расширим сознание на этот раз?', [
    { text: 'Смотрим.', nextId: 'trade_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === LORE ===
  .addLoreNode('lore', 'РИППЕР ДЖАКС', 'Я тот, кто правит ошибки Творца и ленивых кодеров. Учился в Мейнфрейме, но здесь свободнее — никто не запретит писать в Zero-page.', 'intro')

  // === TRADE ===
  .addNode('trade_pitch', 'РИППЕР ДЖАКС', 'Это твой новый фундамент. Помни: при смене прошивки старый кэш может удалить часть твоих "привычек". Что вшиваем?', [
    { text: 'Разблокировать: DevOps (500 Bits)', nextId: 'installed', cost: 500, effect: 'SET_PROFESSION', cardRewardId: 'devops_jun', subtext: 'Мастер развертывания и устойчивости.' },
    { text: 'Разблокировать: Архитектор (900 Bits)', nextId: 'installed', cost: 900, effect: 'SET_PROFESSION', cardRewardId: 'architect_mid', subtext: 'Проектирование сложных цепей.' },
    { text: 'Я передумал.', nextId: 'intro' }
  ])
  .addNode('installed', 'РИППЕР ДЖАКС', 'Чип вошел как родной. Не потеряй мозги в первой же перестрелке. Иди, привыкай к новой реальности.', [
    { text: 'Я... чувствую... (Уйти)', nextId: 'LEAVE' }
  ])

  .build();
