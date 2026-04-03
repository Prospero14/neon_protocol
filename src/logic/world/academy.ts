import type { DialogueTree } from '../dialogues';

export const academy_training: Record<string, DialogueTree> = {
  academy_bootcamp: {
    id: 'academy_bootcamp',
    startNodeId: 'welcome',
    nodes: {
      welcome: {
        id: 'welcome',
        speaker: 'ПРОФЕССОР АРХИПОВ',
        text: 'IDENTITY_VERIFIED: Поздравляю с получением лицензии, нефоро. Но не спеши радоваться. Твоя новая дека — это скальпель в руках хирурга, а ты сейчас больше похож на мясника. Начнем с основ твоей биологической архитектуры.',
        options: [
          { text: 'Я готов слушать. [ CORE_CPU ]', nextId: 'cpu_lecture' },
          { text: 'Пропустить теорию (Не рекомендуется)', nextId: 'LEAVE' }
        ]
      },
      cpu_lecture: {
        id: 'cpu_lecture',
        speaker: 'ПРОФЕССОР АРХИПОВ',
        text: 'CORE_CPU (Центральный Вычислитель) — это твои когнитивные ядра. \n\n```java\nint cores = player.getAvailableCores();\n```\nКаждая карта или действие в бою "ест" один такт. Если ядра на нуле — твой ход окончен. Не пытайся думать быстрее, чем позволяет железо.',
        options: [
          { text: 'Понял. Что насчет NEURAL_RAM?', nextId: 'ram_lecture' }
        ]
      },
      ram_lecture: {
        id: 'ram_lecture',
        speaker: 'ПРОФЕССОР АРХИПОВ',
        text: 'NEURAL_RAM — это твоя оперативная память. Один слот = 512 MiB. \n\n```java\n@NeuralMemory(slots = 4)\npublic class ThinkingProcess {}\n```\nКарта не срабатывает мгновенно. Она загружается в RAM. Если память забита — ты не сможешь планировать новые действия, пока не начнется фаза исполнения (Engineering). Помни: Bits не только валюта, но и ресурс для расширения RAM.',
        options: [
          { text: 'А SYSTEM_STRESS? Говорят, это опасно.', nextId: 'stress_lecture' }
        ]
      },
      stress_lecture: {
        id: 'stress_lecture',
        speaker: 'ПРОФЕССОР АРХИПОВ',
        text: 'SYSTEM_STRESS — это твой системный перегрев. Ошибки, вражеские баги и плохой код повышают его. \n\n```java\nif (stress > 100) system.panic();\n```\nЕсли стресс достигнет 100% — твоя нейронная сеть уйдет в перезагрузку. Ты можешь сбросить его вручную через "Log Washing" (сброс руки), но это стоит хода и карт. Всегда следи за красной шкалой.',
        options: [
          { text: 'Как проходит OPERATIONS?', nextId: 'combat_lecture' }
        ]
      },
      combat_lecture: {
        id: 'combat_lecture',
        speaker: 'ПРОФЕССОР АРХИПОВ',
        text: 'Любой контакт (OPERATIONS) делится на две фазы: \n1. ARCHITECTURE: Ты планируешь код, загружаешь RAM и CPU. \n2. ENGINEERING: Твой код исполняется, нанося урон багам или защищая систему. \n\nНикогда не начинай Engineering, если твоя архитектура — мусор.',
        options: [
          { text: 'Я готов к практике. [ ЗАВЕРШИТЬ ОБУЧЕНИЕ ]', nextId: 'installed_end', completeQuestId: 'q_neon_academy_bootcamp' }
        ]
      },
      installed_end: {
        id: 'installed_end',
        speaker: 'ПРОФЕССОР АРХИПОВ',
        text: 'Теперь ты — сертифицированный оператор. Твоя дека разблокирована в полную мощь. Иди и не позорь мои алгоритмы.',
        options: [
          { text: 'Спасибо, Профессор.', nextId: 'LEAVE' }
        ]
      }
    }
  }
};
