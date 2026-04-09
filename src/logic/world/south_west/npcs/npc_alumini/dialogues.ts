import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_alumini_dialogues = new DialogueBuilder('npc_alumini').withDistrict('south_west')
  .withGreetings({
    neutral: ['intro', 'intro_v2'],
    friendly: ['intro_friendly'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat']
  })
  .addNode('intro', 'БЕГЛЫЙ ВЫПУСКНИК', 'Тише, тише... Не свети деку. Я беглый выпускник из GIGA_BANK. Продаю архивные логи и Shadow Copy. Интересует?', [
    { text: 'Что у тебя есть?', nextId: 'trade' },
    { text: 'Почему ты сбежал?', nextId: 'lore_fugitive' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'БЕГЛЫЙ ВЫПУСКНИК', '*оглядывается по сторонам* Чувствуешь? Это сигнатуры службы безопасности. Я чую их с километра. Быстро, что тебе нужно?', [
    { text: 'Покажи товар.', nextId: 'trade' }
  ])
  .addNode('intro_friendly', 'БЕГЛЫЙ ВЫПУСКНИК', 'Свой человек. В твоих кодах нет запаха корпоративной муштры. Для тебя у меня есть спецпредложение из закромов мертвых серверов.', [
    { text: 'Показывай, не томи.', nextId: 'trade' }
  ])
  .addNode('intro_stressed', 'БЕГЛЫЙ ВЫПУСКНИК', 'Стой! Не делай резких движений. Твои пакеты пляшут, как у стажера перед дедлайном. Провалим всё дело! Уходи, вернись, когда успокоишься.', [
    { text: 'Я спокоен. Давай торговать.', nextId: 'trade' }
  ])
  .addNode('intro_repeat', 'БЕГЛЫЙ ВЫПУСКНИК', 'Снова ты? Мои Shadow Copy разлетаются быстрее, чем горячие пирожки в баре "Студент". Поторопись, пока GIGA_BANK не закрыл лазейку.', [
    { text: 'Что осталось?', nextId: 'trade' }
  ])
  .addLoreNode('lore_fugitive', 'БЕГЛЫЙ ВЫПУСКНИК', 'GIGA_BANK — это не просто банк, это машина по переработке людей в скрипты. Я видел, как они архивируют сознание стажеров. Я чудом выбрался.', 'intro')
  .addNode('trade', 'БЕГЛЫЙ ВЫПУСКНИК', 'Только чистые Bits. Если корпораты увидят транзакцию, нам обоим конец. Смотри быстрее.', [
    { text: 'Shadow Copy (150 Bits)', nextId: 'intro', cost: 150, effect: 'GIVE_CARD', cardRewardId: 'fn_shadow_copy' },
    { text: 'Ничего.', nextId: 'intro' }
  ])
  .build();
