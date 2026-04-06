import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_gb_agent_dialogues = new DialogueBuilder('npc_gb_agent')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'АГЕНТ ГБ', 'Ваши логи подозрительно чисты. GigaBank ценит прозрачность. Хотите внести вклад в безопасность или вы здесь по «темным» делам?', [
    { text: 'Я за порядок. ( +10 GIGABANK )', nextId: 'gb_loyalty', effect: 'GIVE_REPUTATION', amount: 10, cardRewardId: 'GIGA_BANK' },
    { text: 'Кто такие GigaBank?', nextId: 'lore_faction' },
    { text: 'Мне нужна верификация подписи.', nextId: 'quest_signature_finish', requireQuestId: 'q_taganka_bribe_negotiation' },
    { text: 'Просто пью кофе.', nextId: 'LEAVE' },
    { text: '[ Плюнуть в терминал ] ( -15 GIGABANK )', nextId: 'gb_hostile_act', effect: 'GIVE_REPUTATION', amount: -15, cardRewardId: 'GIGA_BANK' }
  ])
  .addNode('intro_v2', 'АГЕНТ ГБ', '*листает планшет* Гражданин. Ваша активность в секторе 14 зафиксирована. Пройдемте на беседу?', [
    { text: 'Я законопослушный.', nextId: 'gb_loyalty' },
    { text: 'Нет оснований.', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly', 'АГЕНТ ГБ', 'А, наш верный гражданин. Ваш рейтинг доверия в диапазоне «Зеленый». GigaBank помнит лояльных.', [
    { text: 'Есть новые задачи?', nextId: 'intro' }
  ])
  .addNode('intro_hostile', 'АГЕНТ ГБ', 'Гражданин с красным рейтингом. Каждое слово будет занесено в протокол. Последнее предупреждение перед блокировкой счета.', [
    { text: 'Ухожу.', nextId: 'LEAVE' }
  ])
  .addNode('intro_stressed', 'АГЕНТ ГБ', 'Пульсация нестандартная. Возможно, химическое воспаление нейростека. Рекомендую явиться в медпункт GigaBank, а не шляться по барам.', [
    { text: 'Это личное дело.', nextId: 'LEAVE' }
  ])
  .addNode('intro_repeat', 'АГЕНТ ГБ', 'Снова вы. Ваша активность в сети аномально высокая. Что происходит?', [
    { text: 'Всё в порядке.', nextId: 'intro' }
  ])
  .addLoreNode('lore_faction', 'АГЕНТ ГБ', 'Мы — кровеносная система экономики Москвы. Без нас Bits не имеют веса. Мы гарантируем стабильность. Хаос — наш общий враг. (+Intel: GigaBank)', 'intro', 'GigaBank')
  .addNode('gb_loyalty', 'АГЕНТ ГБ', 'Правильный выбор. Мы пришлем список аномалий в Чертаново. Стабильность — это валюта.', [
    { text: 'Принято.', nextId: 'LEAVE' }
  ])
  .addNode('gb_hostile_act', 'АГЕНТ ГБ', 'Занесено в протокол. Ваша история будет скорректирована. Уходите, пока я не вызвал группу Аудита.', [
    { text: '[ УЙТИ ]', nextId: 'LEAVE' }
  ])
  .addNode('quest_signature_finish', 'АГЕНТ ГБ', 'Подпись Аудитора? *сканирует* Хм... Валидно. Твой профиль теперь в «Реестре Доверенных». Это откроет двери в Верхний Город.', [
    { text: 'Ценю это. (Завершить)', nextId: 'LEAVE', completeQuestId: 'q_hub_digital_signature' }
  ])
  .build();
