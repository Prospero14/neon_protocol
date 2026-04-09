/**
 * Factions of OctoberLine v0.095
 * Defines the sociopolitical landscape and conflict matrix.
 */

export interface Faction {
  id: string;
  name: string;
  sector: 'CORPORATE' | 'STATE' | 'UNDERGROUND' | 'SPECIALIZED';
  description: string;
  homeDistrictIds: string[];
  enemies: string[]; // Direct conflict targets
}

export const FACTIONS: Record<string, Faction> = {
  GIGABANK: {
    id: 'GIGABANK',
    name: 'GigaBank',
    sector: 'CORPORATE',
    description: 'Финансовый гигант, контролирующий поток Bits в городе. Презирают тех, у кого низкий кредитный рейтинг.',
    homeDistrictIds: ['sokolniki'],
    enemies: ['RUST_VALLEY', 'NULLPOINTERS']
  },
  TELECON: {
    id: 'TELECON',
    name: 'Telecon',
    sector: 'CORPORATE',
    description: 'Единственный провайдер связи в Октябре. Владеют Магистралью и всеми протоколами передачи данных.',
    homeDistrictIds: ['mitino'],
    enemies: ['NULLPOINTERS']
  },
  KRYLOVO_CORP: {
    id: 'KRYLOVO_CORP',
    name: 'Krylovo Corp',
    sector: 'CORPORATE',
    description: 'Системы безопасности, лицензионные ОС и контроль за исполнением кода. Драконовские методы.',
    homeDistrictIds: ['vdnkh', 'sokol'],
    enemies: ['NULLPOINTERS', 'REDUNDANTS']
  },
  REGULATORS: {
    id: 'REGULATORS',
    name: 'Regulators',
    sector: 'STATE',
    description: 'Остатки государственного аппарата. Бюрократия, карательные боты и поддержание "стабильности".',
    homeDistrictIds: ['maryino'],
    enemies: ['NULLPOINTERS', 'RUST_VALLEY']
  },
  NULLPOINTERS: {
    id: 'NULLPOINTERS',
    name: 'Nullpointers',
    sector: 'UNDERGROUND',
    description: 'Анархо-хакеры. Считают, что весь код должен быть свободным, а лицензии — это цепи.',
    homeDistrictIds: ['chertanovo', 'maryino'],
    enemies: ['KRYLOVO_CORP', 'REGULATORS', 'TELECON']
  },
  RUST_VALLEY: {
    id: 'RUST_VALLEY',
    name: 'Scavengers (Rust Valley)',
    sector: 'UNDERGROUND',
    description: 'Сообщество инженеров-мусорщиков. Выживают за счет ресайклинга и "грязного" железа.',
    homeDistrictIds: ['vykhino', 'altufyevo'],
    enemies: ['GIGABANK', 'SILICON_HEDGE']
  },
  SILICON_HEDGE: {
    id: 'SILICON_HEDGE',
    name: 'Silicon Hedge',
    sector: 'SPECIALIZED',
    description: 'Элитарные ИИ-культисты и трансгуманисты. Стремятся к полному слиянию с Сетью.',
    homeDistrictIds: ['south_west', 'izmailovo'],
    enemies: ['RUST_VALLEY', 'REDUNDANTS']
  },
  BIOSYNDICATE: {
    id: 'BIOSYNDICATE',
    name: 'Biosyndicate',
    sector: 'SPECIALIZED',
    description: 'Мастера мокрого кода и биологических аугментаций. Твой мозг — это тоже процессор.',
    homeDistrictIds: ['teply_stan'],
    enemies: ['REDUNDANTS']
  },
  REDUNDANTS: {
    id: 'REDUNDANTS',
    name: 'Redundants',
    sector: 'SPECIALIZED',
    description: 'Хранители "чистой" цифры и старых протоколов (Win95/Pascal). Ненавидят биотех и облака.',
    homeDistrictIds: ['tekstilschiki', 'bibirevo'],
    enemies: ['BIOSYNDICATE', 'KRYLOVO_CORP', 'SILICON_HEDGE']
  },
  NET_DRIVERS: {
    id: 'NET_DRIVERS',
    name: 'Net Drivers',
    sector: 'STATE',
    description: 'Монополисты логистики и транспортных терминалов. Держат такси-сеть города.',
    homeDistrictIds: ['perovo'],
    enemies: [] // Нейтральные перевозчики
  },
  CYBERCOMMIS: {
    id: 'CYBERCOMMIS',
    name: 'CyberCommis',
    sector: 'UNDERGROUND',
    description: 'Радикальное движение за обобществление цифровых ресурсов. "Биты — народу, дефрагментация — эксплуататорам". Оперативная база в Перово.',
    homeDistrictIds: ['perovo'],
    enemies: ['GIGABANK', 'KRYLOVO_CORP', 'SILICON_HEDGE']
  }
};
