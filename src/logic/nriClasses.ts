/** Классы персонажей НРИ (Cyberpunk RED inspired). */

export type NriClassId = 'daimyo' | 'doc' | 'merc' | 'hacker' | 'detective' | 'fixer';

export type NriStatBlock = {
  body: number;
  reflex: number;
  intelligence: number;
  tech: number;
  cool: number;
  hp: number;
  armor: number;
  special: string;
};

export type NriClassDef = {
  id: NriClassId;
  name: string;
  tagline: string;
  description: string;
  stats: NriStatBlock;
};

export const NRI_CLASSES: NriClassDef[] = [
  {
    id: 'daimyo',
    name: 'Даймё',
    tagline: 'Лидер · тяжёлое вооружение · Fury',
    description:
      'Прирождённые лидеры и эксперты по тяжёлому вооружению. Меньше всех получают урона за счёт Fury. С 3 уровня — суго (принятие урона) или сэнгоку (урон тяжёлым оружием).',
    stats: { body: 8, reflex: 6, intelligence: 5, tech: 4, cool: 7, hp: 50, armor: 12, special: 'Fury: −25% входящего урона' },
  },
  {
    id: 'doc',
    name: 'Док',
    tagline: 'Медик · наноботы · реанимация',
    description:
      'Медики с имплантом наноботов. На высоких уровнях возвращают товарищей. Специализации: боевой медик и киберхирург.',
    stats: { body: 5, reflex: 6, intelligence: 8, tech: 7, cool: 6, hp: 40, armor: 6, special: 'MediStim: +15 HP/раунд в бою' },
  },
  {
    id: 'merc',
    name: 'Наёмник',
    tagline: 'Универсал · больше апгрейдов',
    description:
      'Специалист по всем видам вооружения. Больше всего повышений характеристик — простой класс для новичков. С 3 уровня: быстрый боец, морпех или уличный самурай.',
    stats: { body: 7, reflex: 7, intelligence: 5, tech: 5, cool: 6, hp: 45, armor: 10, special: 'Versatile: +1 к любому оружию' },
  },
  {
    id: 'hacker',
    name: 'Хакер',
    tagline: 'Эксплойты · дебаффы · робомант',
    description:
      'Сложный класс: девять хакерских эксплойтов с первого уровня. Боевой хакер наносит прямой урон, робомант получает стального напарника.',
    stats: { body: 4, reflex: 6, intelligence: 9, tech: 9, cool: 5, hp: 35, armor: 4, special: 'Netdeck: 3 слота эксплойтов' },
  },
  {
    id: 'detective',
    name: 'Детектив',
    tagline: 'Разведка · социалка · обход боя',
    description:
      'Класс для социального взаимодействия и разведки. Журналисты и частные сыщики избегают боя или упрощают его.',
    stats: { body: 5, reflex: 7, intelligence: 8, tech: 6, cool: 8, hp: 38, armor: 5, special: 'Intel: +2 к проверкам расследования' },
  },
  {
    id: 'fixer',
    name: 'Пройдоха',
    tagline: 'Ключи от всех дверей · уклонение',
    description:
      'Находит слабые места — бонус к урону. По нему сложно попасть. Сорвиголовы, каскадёры или контрабандисты.',
    stats: { body: 6, reflex: 8, intelligence: 6, tech: 5, cool: 7, hp: 42, armor: 7, special: 'Slip: +15% уклонения' },
  },
];

export function getNriClass(id: string): NriClassDef | undefined {
  return NRI_CLASSES.find((c) => c.id === id);
}
