import type { DialogueTree } from '../../../../dialogues';
import { DialogueBuilder } from '../../../../dialogueUtils';

export const npc_chertanovo_paranoid_dialogue: DialogueTree = new DialogueBuilder('npc_chertanovo_paranoid')
  .withGreetings({
    neutral: ['intro', 'intro_v2', 'intro_v3'],
    friendly: ['intro_friendly', 'intro_friendly_v2'],
    hostile: ['intro_hostile'],
    stressed: ['intro_stressed'],
    repeat: ['intro_repeat', 'intro_repeat_v2']
  })

  // === NEUTRAL POOL ===
  .addNode('intro', 'ПАРАНОИК', 'Тихо! Они слушают через чайники! Настоящая приватность стоит дорого. Твои пакеты светятся... Они знают, что ты здесь. Ядро индексирует твои мысли.', [
    { text: 'Я могу помочь с защитой.', nextId: 'quest_pitch' },
    { text: 'Я принес Privacy Patch.', nextId: 'quest_finish', requireQuestId: 'q_chertanovo_privacy' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v2', 'ПАРАНОИК', '*заклеивает камеру* За тобой нет "хвоста"? Пока нет. Умеешь прятаться? Я не про визуальный камуфляж, я про логи. Они должны быть пустыми.', [
    { text: 'Я умею.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_v3', 'ПАРАНОИК', 'Вибрация в портах... Ядро пересчитывает наши хеши! Слышишь? Про-ин-дек-си-ру-ют! Скоро мы все станем просто записями в базе данных.', [
    { text: 'Жуть.', nextId: 'intro' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === FRIENDLY POOL ===
  .addNode('intro_friendly', 'ПАРАНОИК', 'Тсс! Твой паттерн — чистая пустота. Никсанна хорошо поработала. Ты теперь один из немногих, кто не фонит в этой системе. Есть еще секрет...', [
    { text: 'Рассказывай.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])
  .addNode('intro_friendly_v2', 'ПАРАНОИК', 'Ты принес... тишину. В твоих логах нет мусора. Хочешь, я покажу тебе, как Ядро скрывает баги в Юго-Западе? Там всё... подозрительно стабильно.', [
    { text: 'Давай.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === HOSTILE POOL ===
  .addNode('intro_hostile', 'ПАРАНОИК', 'Ааа! Ты — приманка Ядра! Твой ID светится как маяк! Уходи, пока они не вычислили мой IP по твоим глазам! Сгинь!', [
    { text: 'Тише, я ухожу.', nextId: 'LEAVE' }
  ])

  // === STRESSED POOL ===
  .addNode('intro_stressed', 'ПАРАНОИК', 'У тебя... пиксели в глазах дрожат... Это "Восход" на тебя так давит? Или ты просто перегрет? Отойди от моей высотки, не приводи их сюда!', [
    { text: 'Я в порядке.', nextId: 'intro' },
    { text: 'Пойду остыну.', nextId: 'LEAVE' }
  ])

  // === REPEAT POOL ===
  .addNode('intro_repeat', 'ПАРАНОИК', '*устанавливает патч* Тот Privacy Patch работает... Я теперь невидимка для поисковых ботов. Но Ядро всё еще там. Есть еще идеи по маскировке?', [
    { text: 'Давай контракт.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ], { requireCompletedQuestId: 'q_chertanovo_privacy' })
  .addNode('intro_repeat_v2', 'ПАРАНОИК', 'Слышал, ты и в Алтуфьево был. Никсанна всё еще видит мир как бета-тест? Ха. Она права. Мы все — просто ошибки рендеринга.', [
    { text: 'Расскажи еще.', nextId: 'quest_pitch' },
    { text: '[Уйти]', nextId: 'LEAVE' }
  ])

  // === QUEST NODES ===
  .addNode('quest_pitch', 'ПАРАНОИК', 'В Алтуфьево есть Никсанна. Принеси от неё "Privacy Patch". Она знает, как обмануть сканеры Октября. Но ты настоящий или просто симуляция?', [
    { text: 'Схожу к ней (Standard).', nextId: 'rank_check' },
    { text: 'Соберу фильтр на месте (Technical).', nextId: 'quest_pitch_tech', requireMinLevel: 3 },
    { text: 'Связи с Net Drivers (Social).', nextId: 'quest_pitch_social', requireReputation: { factionId: 'NET_DRIVERS', minPoints: 15 } }
  ])
  .addNode('quest_pitch_tech', 'ПАРАНОИК', 'Собрать на месте? Если пропустишь хоть один пакет Ядра — нас обоих "сотрудт" из реальности. Рискуешь?', [
    { text: 'Да. Проверяй.', nextId: 'rank_check' }
  ])
  .addNode('quest_pitch_social', 'ПАРАНОИК', 'Net Drivers... если достанешь временный токен из их репозитория — я в долгу не останусь. Порядок превыше всего.', [
    { text: 'Берусь.', nextId: 'rank_check' }
  ])

  // === RANK CHECK ===
  .addNode('rank_check', 'ПАРАНОИК', '*нервно сканирует порт* Ну-ка... Анализ прерываний... Проверка хеш-суммы лояльности...', [
    { text: '[ Ждать ]', nextId: 'quest_reject', requireMaxLevel: 1, isTraineeOnly: true },
    { text: '[ Ждать ]', nextId: 'quest_accept', requireMinLevel: 2 },
    { text: '[ Ждать ]', nextId: 'quest_accept', isProOnly: true }
  ])
  .addNode('quest_reject', 'ПАРАНОИК', 'Нет-нет-нет! Твой уровень слишком мал! Ты просто шум! Ядро тебя поглотит и даже не заметит! Возвращайся, когда твой стек станет "Mid-level".', [
    { text: 'Я еще вернусь.', nextId: 'LEAVE' }
  ])
  .addNode('quest_accept', 'ПАРАНОИК', 'Твой след чист... пока что. Принеси мне патч или токен. Стены имеют уши, а чайники — глаза. Помни об этом.', [
    { text: '[ ПРИНЯТЬ КОНТРАКТ ]', nextId: 'LEAVE', awardQuestId: 'q_chertanovo_privacy' }
  ])

  .addNode('quest_finish', 'ПАРАНОИК', '*быстро устанавливает патч* Красные полоски на мониторе исчезли! Я невидимка! Я Null! Держи "Shadow_Layer" — этот скрипт спасет твой IP в трудную минуту.', [
    { text: 'Удачи, Параноик.', nextId: 'intro', completeQuestId: 'q_chertanovo_privacy' }
  ])

  .build();
